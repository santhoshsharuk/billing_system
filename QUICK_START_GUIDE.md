# 🎯 Billing System - Quick Start Guide

## 📋 Table of Contents
1. [Installation](#installation)
2. [First Launch](#first-launch)
3. [User Interface Overview](#user-interface-overview)
4. [Step-by-Step Workflows](#workflows)
5. [Tips & Tricks](#tips)

---

## 🚀 Installation

### Method 1: Run from Source (Development)
```powershell
# Navigate to project directory
cd d:\Santhosh_Project\billing_sys

# Install dependencies (first time only)
npm install

# Run the application
npm start
# OR
npx electron .
```

### Method 2: Build Executable (Production)
```powershell
# Build for Windows
npm run build-win

# The installer will be in the dist/ folder
# Double-click to install
```

---

## 🔐 First Launch

1. **Login Screen appears**
   - Default Username: `admin`
   - Default Password: `admin123`
   - Click "Login"

2. **Dashboard loads automatically**
   - You'll see stats cards (all zeros initially)
   - Navigation sidebar on the left
   - Ready to start!

---

## 🖥️ User Interface Overview

### Sidebar Navigation (Left)
```
📊 Dashboard      - Sales overview & analytics
💵 Create Bill    - Generate new invoices
👥 Customers      - Manage customer database
📦 Products       - Manage product inventory
📈 Reports        - View sales reports
⚙️  Settings      - App configuration
```

### Top Bar
- Shows current page name
- Action buttons (Add, Search, Export, etc.)
- Changes per page

### Main Content Area
- Dynamic content based on selected page
- Tables, forms, and charts

---

## 📝 Step-by-Step Workflows

### 🛒 Workflow 1: Add Your First Product

1. Click **"Products"** in sidebar
2. Click **"+ Add Product"** button
3. Fill in the form:
   ```
   Product Name: Laptop
   Price: 50000
   Tax (%): 18
   Stock Quantity: 10
   ```
4. Click **"Add Product"**
5. ✅ Product appears in table

**Pro Tip**: Add 5-10 products to start with!

---

### 👤 Workflow 2: Add a Customer

1. Click **"Customers"** in sidebar
2. Click **"+ Add Customer"** button
3. Fill in the form:
   ```
   Name: John Doe
   Phone: 9876543210
   Email: john@example.com (optional)
   Address: 123 Street, City (optional)
   ```
4. Click **"Add Customer"**
5. ✅ Customer appears in table

---

### 🧾 Workflow 3: Create Your First Bill

1. Click **"Create Bill"** in sidebar

2. **Select Customer**
   - Open "Customer" dropdown
   - Select a customer
   - Or click **"+"** to add new customer

3. **Select Payment Mode**
   - Cash / UPI / Card / Cheque

4. **Add Products to Bill**
   - Select product from dropdown
   - Enter quantity
   - Click **"+ Add"**
   - Repeat for more products

5. **Review Bill Summary** (Right side)
   - Shows Subtotal
   - Shows Tax
   - Shows Total Amount

6. Click **"Generate Bill"**

7. **PDF Invoice opens automatically!**
   - Can print
   - Can save
   - Stored in: `%AppData%/billing_sys/invoices/`

8. Bill clears automatically, ready for next customer

---

### 📊 Workflow 4: View Dashboard

1. Click **"Dashboard"** in sidebar
2. View stats cards:
   - Today's Sales
   - Today's Bills Count
   - Total Customers
   - Total Products

3. **Sales Chart** shows last 7 days trend

4. **Recent Bills** shows last 5 transactions

5. Click **"Refresh"** to update stats

---

### 📈 Workflow 5: Generate Reports

1. Click **"Reports"** in sidebar

2. **Select Period**:
   - Today
   - This Week
   - This Month
   - Custom Range

3. View report stats:
   - Total Sales
   - Total Bills

4. Click **"Export"** to save as JSON

---

## 🎯 Common Tasks

### ✏️ Edit a Customer
1. Go to Customers page
2. Click **pencil icon** (✏️) next to customer
3. Update details
4. Click "Update Customer"

### 🗑️ Delete a Product
1. Go to Products page
2. Click **trash icon** (🗑️) next to product
3. Confirm deletion

### 🔍 Search
- Use search box at top of Customers/Products pages
- Type name, phone, or email
- Results filter instantly

### 💾 Backup Database
1. Go to Settings
2. Click **"Backup Database"**
3. Choose save location
4. Done! ✅

---

## 💡 Tips & Tricks

### Keyboard Shortcuts
- **Alt + Tab**: Switch between pages
- **Ctrl + S**: Quick save (in forms)
- **Esc**: Close modals

### Best Practices

1. **Add Products First**
   - Before creating bills, add all your products
   - Include accurate tax rates

2. **Regular Backups**
   - Backup database weekly
   - Store backups in multiple locations

3. **Update Stock**
   - Stock auto-decreases on sales
   - Manually update when restocking

4. **Customer Info**
   - Add phone numbers (required)
   - Email for digital invoices later

5. **Invoice Organization**
   - Invoices auto-named with bill ID
   - Stored in chronological order

### Invoice Customization
Edit `src/services/invoiceGenerator.js`:
```javascript
// Line 30-35: Update your business info
.text('YOUR SHOP NAME', 50, 50)
.text('Your Address', 50, 80)
.text('Phone: Your Phone', 50, 95)
.text('GST: Your GST Number', 50, 110)
```

### Change Theme Colors
Edit `src/styles/main.css`:
```css
:root {
    --primary: #2196F3;     /* Change to your brand color */
    --success: #4CAF50;
    --danger: #f44336;
}
```

---

## 🐛 Troubleshooting

### App won't start?
```powershell
# Clear cache and reinstall
rm -r node_modules
rm package-lock.json
npm install
npm start
```

### PDF not generating?
- Check if default PDF viewer is set
- Check invoices folder permissions
- Try opening manually from: `%AppData%/billing_sys/invoices/`

### Database error?
- Close all app instances
- Check database isn't locked by another process
- Restore from backup if corrupted

### "Module not found" error?
```powershell
npm install
```

---

## 📂 File Locations

### Windows
- **App Data**: `C:\Users\<YourName>\AppData\Roaming\billing_sys\`
- **Database**: `...\billing_sys\billing.db`
- **Invoices**: `...\billing_sys\invoices\`

### Mac
- **App Data**: `~/Library/Application Support/billing_sys/`

### Linux
- **App Data**: `~/.config/billing_sys/`

---

## 🎨 Customization Ideas

1. **Add Your Logo**
   - Replace `src/assets/icon.png`
   - Update in `invoiceGenerator.js`

2. **Add More Fields**
   - Edit `dbManager.js` for database
   - Update forms in `index.html`
   - Update logic in `renderer.js`

3. **Change Invoice Template**
   - Modify `src/services/invoiceGenerator.js`
   - Customize layout, colors, fonts

4. **Add Barcode Scanner**
   - Install barcode library
   - Add scanner input in billing page
   - Auto-fill product on scan

---

## 📞 Quick Reference

| Feature | Location | Shortcut |
|---------|----------|----------|
| Dashboard | Sidebar | - |
| New Bill | Sidebar → Create Bill | - |
| Add Customer | Customers → + Button | - |
| Add Product | Products → + Button | - |
| Search | Top Bar Input | Type to filter |
| Backup | Settings → Backup Button | - |
| Logout | Sidebar Bottom | - |

---

## 🎓 Learning Path

### Day 1: Setup
- [ ] Install app
- [ ] Login with default credentials
- [ ] Explore all pages

### Day 2: Data Entry
- [ ] Add 10 products
- [ ] Add 5 customers
- [ ] Create 3 test bills

### Day 3: Daily Use
- [ ] Check dashboard
- [ ] Create real bills
- [ ] Update stock

### Week 1: Mastery
- [ ] Generate reports
- [ ] Backup database
- [ ] Customize invoice
- [ ] Set up your branding

---

## 🌟 Pro Features to Explore Later

1. **Customer Purchase History**
   - View in Reports section
   - Filter by customer

2. **Stock Alerts**
   - Red badge = Out of stock
   - Yellow = Low stock
   - Green = In stock

3. **Sales Trends**
   - Chart shows weekly performance
   - Identify peak days

4. **Payment Tracking**
   - Bills store payment mode
   - Reports can filter by payment type

---

## ✅ Daily Checklist

**Morning:**
- [ ] Open app
- [ ] Check dashboard
- [ ] Review stock levels

**During Day:**
- [ ] Create bills as customers come
- [ ] Add new customers/products as needed

**Evening:**
- [ ] Review today's sales
- [ ] Backup database (weekly)
- [ ] Update low stock items

---

## 🔒 Security Reminders

1. ✅ Change default password (Settings → User Management)
2. ✅ Keep backups in secure location
3. ✅ Don't share login credentials
4. ✅ Regular database backups
5. ✅ Keep app updated

---

**Need Help?** Check the main README.md for detailed technical documentation!

**Happy Billing! 🎉**
