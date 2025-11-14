// dbManager.js - Database Manager using better-sqlite3
const Database = require('better-sqlite3');
const crypto = require('crypto');

class DatabaseManager {
    constructor(dbPath) {
        this.db = new Database(dbPath);
        this.db.pragma('journal_mode = WAL');
        this.initializeTables();
        this.createDefaultUser();
    }

    initializeTables() {
        // Users table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'admin',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Customers table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS customers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                phone TEXT NOT NULL,
                email TEXT,
                address TEXT,
                loyalty_points INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Products table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                category TEXT DEFAULT 'Others',
                cost_price REAL DEFAULT 0,
                price REAL NOT NULL,
                tax REAL DEFAULT 0,
                stock INTEGER DEFAULT 0,
                image TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Bills table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS bills (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id INTEGER NOT NULL,
                date DATETIME DEFAULT CURRENT_TIMESTAMP,
                subtotal REAL NOT NULL,
                discount REAL DEFAULT 0,
                tax REAL NOT NULL,
                total REAL NOT NULL,
                payment_mode TEXT NOT NULL,
                points_earned INTEGER DEFAULT 0,
                points_redeemed INTEGER DEFAULT 0,
                FOREIGN KEY (customer_id) REFERENCES customers(id)
            )
        `);

        // Bill items table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS bill_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                bill_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                product_name TEXT NOT NULL,
                quantity INTEGER NOT NULL,
                cost_price REAL DEFAULT 0,
                price REAL NOT NULL,
                tax REAL NOT NULL,
                total REAL NOT NULL,
                FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id)
            )
        `);

        // Create indexes
        this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_bills_date ON bills(date);
            CREATE INDEX IF NOT EXISTS idx_bills_customer ON bills(customer_id);
            CREATE INDEX IF NOT EXISTS idx_bill_items_bill ON bill_items(bill_id);
        `);

        // Migrations: Add new columns if they don't exist
        try {
            this.db.exec(`ALTER TABLE products ADD COLUMN image TEXT`);
        } catch (error) {
            // Column already exists, ignore error
        }
        
        try {
            this.db.exec(`ALTER TABLE products ADD COLUMN cost_price REAL DEFAULT 0`);
        } catch (error) {
            // Column already exists, ignore error
        }
        
        try {
            this.db.exec(`ALTER TABLE products ADD COLUMN category TEXT DEFAULT 'Others'`);
        } catch (error) {
            // Column already exists, ignore error
        }
        
        try {
            this.db.exec(`ALTER TABLE customers ADD COLUMN loyalty_points INTEGER DEFAULT 0`);
        } catch (error) {
            // Column already exists, ignore error
        }
        
        try {
            this.db.exec(`ALTER TABLE bills ADD COLUMN discount REAL DEFAULT 0`);
        } catch (error) {
            // Column already exists, ignore error
        }
        
        try {
            this.db.exec(`ALTER TABLE bills ADD COLUMN points_earned INTEGER DEFAULT 0`);
        } catch (error) {
            // Column already exists, ignore error
        }
        
        try {
            this.db.exec(`ALTER TABLE bills ADD COLUMN points_redeemed INTEGER DEFAULT 0`);
        } catch (error) {
            // Column already exists, ignore error
        }
        
        try {
            this.db.exec(`ALTER TABLE bill_items ADD COLUMN cost_price REAL DEFAULT 0`);
        } catch (error) {
            // Column already exists, ignore error
        }
    }

    createDefaultUser() {
        const checkUser = this.db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
        if (!checkUser) {
            const password = this.hashPassword('admin123');
            this.db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('admin', password, 'admin');
        }
    }

    hashPassword(password) {
        return crypto.createHash('sha256').update(password).digest('hex');
    }

    // ============ USER OPERATIONS ============
    authenticateUser(username, password) {
        const hashedPassword = this.hashPassword(password);
        const user = this.db.prepare('SELECT id, username, role FROM users WHERE username = ? AND password = ?')
            .get(username, hashedPassword);
        
        if (!user) {
            throw new Error('Invalid credentials');
        }
        return user;
    }

    // ============ DASHBOARD ============
    getDashboardStats() {
        const today = new Date().toISOString().split('T')[0];

        // Today's sales
        const todaySalesResult = this.db.prepare(`
            SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as count 
            FROM bills 
            WHERE DATE(date) = DATE(?)
        `).get(today);

        // Total profit (selling price - cost price)
        const totalProfitResult = this.db.prepare(`
            SELECT COALESCE(SUM((price - cost_price) * quantity), 0) as profit
            FROM bill_items
        `).get();

        // Total customers
        const totalCustomers = this.db.prepare('SELECT COUNT(*) as count FROM customers').get().count;

        // Total products
        const totalProducts = this.db.prepare('SELECT COUNT(*) as count FROM products').get().count;

        // Low stock products (stock <= 10)
        const lowStockCount = this.db.prepare('SELECT COUNT(*) as count FROM products WHERE stock <= 10').get().count;

        // Last 7 days sales data for chart
        const salesData = this.db.prepare(`
            SELECT DATE(date) as date, SUM(total) as total
            FROM bills
            WHERE date >= DATE('now', '-7 days')
            GROUP BY DATE(date)
            ORDER BY date
        `).all();

        const labels = [];
        const values = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
            
            const dayData = salesData.find(d => d.date === dateStr);
            values.push(dayData ? dayData.total : 0);
        }

        return {
            todaySales: todaySalesResult.total,
            todayBills: todaySalesResult.count,
            totalProfit: totalProfitResult.profit,
            totalCustomers,
            totalProducts,
            lowStockCount,
            salesData: { labels, values }
        };
    }

    // ============ CUSTOMER OPERATIONS ============
    getAllCustomers() {
        return this.db.prepare('SELECT * FROM customers ORDER BY created_at DESC').all();
    }

    addCustomer(customer) {
        const stmt = this.db.prepare(`
            INSERT INTO customers (name, phone, email, address) 
            VALUES (?, ?, ?, ?)
        `);
        const result = stmt.run(customer.name, customer.phone, customer.email || null, customer.address || null);
        return result.lastInsertRowid;
    }

    updateCustomer(id, customer) {
        const stmt = this.db.prepare(`
            UPDATE customers 
            SET name = ?, phone = ?, email = ?, address = ? 
            WHERE id = ?
        `);
        stmt.run(customer.name, customer.phone, customer.email || null, customer.address || null, id);
    }

    deleteCustomer(id) {
        this.db.prepare('DELETE FROM customers WHERE id = ?').run(id);
    }

    searchCustomers(query) {
        return this.db.prepare(`
            SELECT * FROM customers 
            WHERE name LIKE ? OR phone LIKE ? OR email LIKE ?
            ORDER BY name
        `).all(`%${query}%`, `%${query}%`, `%${query}%`);
    }

    getCustomerLoyaltyInfo(customerId) {
        const customer = this.db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId);
        const totalPurchases = this.db.prepare(`
            SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total 
            FROM bills WHERE customer_id = ?
        `).get(customerId);
        
        return {
            ...customer,
            total_purchases: totalPurchases.count,
            total_spent: totalPurchases.total,
            points_value: (customer.loyalty_points / 10).toFixed(2) // 1000 points = ₹100
        };
    }

    // ============ PRODUCT OPERATIONS ============
    getAllProducts() {
        return this.db.prepare('SELECT * FROM products ORDER BY name').all();
    }

    addProduct(product) {
        const stmt = this.db.prepare(`
            INSERT INTO products (name, category, cost_price, price, tax, stock, image) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(
            product.name, 
            product.category || 'Others', 
            product.cost_price || 0, 
            product.price, 
            product.tax || 0, 
            product.stock || 0, 
            product.image || null
        );
        return result.lastInsertRowid;
    }

    updateProduct(id, product) {
        const stmt = this.db.prepare(`
            UPDATE products 
            SET name = ?, category = ?, cost_price = ?, price = ?, tax = ?, stock = ?, image = ? 
            WHERE id = ?
        `);
        stmt.run(
            product.name, 
            product.category || 'Others', 
            product.cost_price || 0, 
            product.price, 
            product.tax || 0, 
            product.stock || 0, 
            product.image || null, 
            id
        );
    }

    deleteProduct(id) {
        this.db.prepare('DELETE FROM products WHERE id = ?').run(id);
    }

    searchProducts(query) {
        return this.db.prepare(`
            SELECT * FROM products 
            WHERE name LIKE ? 
            ORDER BY name
        `).all(`%${query}%`);
    }

    updateProductStock(productId, quantity) {
        this.db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(quantity, productId);
    }

    // ============ BILL OPERATIONS ============
    createBill(billData) {
        const createBill = this.db.transaction((data) => {
            // Use passed values if provided (respects tax settings from frontend)
            // Otherwise calculate (for backwards compatibility)
            let subtotal = data.subtotal;
            let tax = data.tax;
            let totalCost = 0;

            // If subtotal not provided, calculate it
            if (subtotal === undefined) {
                subtotal = 0;
                tax = 0;
                data.items.forEach(item => {
                    const itemSubtotal = item.price * item.quantity;
                    const itemTax = (itemSubtotal * item.tax) / 100;
                    subtotal += itemSubtotal;
                    tax += itemTax;
                    totalCost += (item.cost_price || 0) * item.quantity;
                });
            } else {
                // Calculate only totalCost
                data.items.forEach(item => {
                    totalCost += (item.cost_price || 0) * item.quantity;
                });
            }

            const discount = data.discount || 0;
            const pointsRedeemed = data.points_redeemed || 0;
            const pointsDiscount = pointsRedeemed / 10; // 1000 points = ₹100
            
            const total = subtotal + tax - discount - pointsDiscount;
            
            // Calculate points earned (1% of total as points, 100 rupees = 100 points)
            const pointsEarned = Math.floor(total);

            // Insert bill
            const billStmt = this.db.prepare(`
                INSERT INTO bills (customer_id, subtotal, discount, tax, total, payment_mode, points_earned, points_redeemed)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);
            const billResult = billStmt.run(
                data.customer_id, 
                subtotal, 
                discount + pointsDiscount, 
                tax, 
                total, 
                data.payment_mode,
                pointsEarned,
                pointsRedeemed
            );
            const billId = billResult.lastInsertRowid;

            // Insert bill items and update stock
            const itemStmt = this.db.prepare(`
                INSERT INTO bill_items (bill_id, product_id, product_name, quantity, cost_price, price, tax, total)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);

            data.items.forEach(item => {
                const itemSubtotal = item.price * item.quantity;
                const itemTax = (itemSubtotal * item.tax) / 100;
                const itemTotal = itemSubtotal + itemTax;

                itemStmt.run(
                    billId, 
                    item.product_id, 
                    item.name, 
                    item.quantity, 
                    item.cost_price || 0,
                    item.price, 
                    item.tax, 
                    itemTotal
                );
                this.updateProductStock(item.product_id, item.quantity);
            });

            // Update customer loyalty points
            const currentPoints = this.db.prepare('SELECT loyalty_points FROM customers WHERE id = ?').get(data.customer_id);
            const newPoints = (currentPoints?.loyalty_points || 0) + pointsEarned - pointsRedeemed;
            this.db.prepare('UPDATE customers SET loyalty_points = ? WHERE id = ?').run(newPoints, data.customer_id);

            return billId;
        });

        return createBill(billData);
    }

    getAllBills(startDate, endDate) {
        let query = `
            SELECT b.*, c.name as customer_name, c.phone as customer_phone
            FROM bills b
            JOIN customers c ON b.customer_id = c.id
        `;

        const params = [];
        if (startDate && endDate) {
            query += ' WHERE DATE(b.date) BETWEEN DATE(?) AND DATE(?)';
            params.push(startDate, endDate);
        }

        query += ' ORDER BY b.date DESC';

        return this.db.prepare(query).all(...params);
    }

    getBillById(id) {
        const bill = this.db.prepare(`
            SELECT b.*, c.name as customer_name, c.phone as customer_phone, 
                   c.email as customer_email, c.address as customer_address
            FROM bills b
            JOIN customers c ON b.customer_id = c.id
            WHERE b.id = ?
        `).get(id);

        if (!bill) {
            throw new Error('Bill not found');
        }

        const items = this.db.prepare(`
            SELECT * FROM bill_items WHERE bill_id = ?
        `).all(id);

        bill.items = items;
        return bill;
    }

    deleteBill(id) {
        // Delete bill (cascade will delete items)
        this.db.prepare('DELETE FROM bills WHERE id = ?').run(id);
    }

    // ============ REPORTS ============
    getSalesReport(period, startDate, endDate) {
        let dateFilter = '';
        const params = [];

        switch (period) {
            case 'today':
                dateFilter = "WHERE DATE(date) = DATE('now')";
                break;
            case 'week':
                dateFilter = "WHERE date >= DATE('now', '-7 days')";
                break;
            case 'month':
                dateFilter = "WHERE date >= DATE('now', '-1 month')";
                break;
            case 'custom':
                if (startDate && endDate) {
                    dateFilter = 'WHERE DATE(date) BETWEEN DATE(?) AND DATE(?)';
                    params.push(startDate, endDate);
                }
                break;
        }

        const query = `
            SELECT 
                COUNT(*) as totalBills,
                COALESCE(SUM(total), 0) as totalSales,
                COALESCE(AVG(total), 0) as avgBillAmount
            FROM bills
            ${dateFilter}
        `;

        const salesData = this.db.prepare(query).get(...params);

        // Get top products
        const topProductsQuery = `
            SELECT 
                bi.product_name,
                SUM(bi.quantity) as quantity_sold,
                SUM(bi.total) as total_revenue
            FROM bill_items bi
            JOIN bills b ON bi.bill_id = b.id
            ${dateFilter}
            GROUP BY bi.product_id, bi.product_name
            ORDER BY total_revenue DESC
            LIMIT 10
        `;
        const topProducts = this.db.prepare(topProductsQuery).all(...params);

        // Get payment methods breakdown
        const paymentMethodsQuery = `
            SELECT 
                payment_mode,
                COUNT(*) as count,
                SUM(total) as total
            FROM bills
            ${dateFilter}
            GROUP BY payment_mode
        `;
        const paymentMethods = this.db.prepare(paymentMethodsQuery).all(...params);

        return {
            ...salesData,
            topProducts,
            paymentMethods
        };
    }

    getCustomerPurchaseHistory(customerId) {
        return this.db.prepare(`
            SELECT b.*, 
                   (SELECT COUNT(*) FROM bill_items WHERE bill_id = b.id) as item_count
            FROM bills b
            WHERE b.customer_id = ?
            ORDER BY b.date DESC
        `).all(customerId);
    }

    close() {
        this.db.close();
    }
}

module.exports = DatabaseManager;
