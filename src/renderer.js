// renderer.js - Frontend Logic
let currentUser = null;
let billItems = [];
let allCustomers = [];
let allProducts = [];
let salesChart = null;

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', () => {
    initializeLoginForm();
    initializeNavigation();
    initializeBillingPage();
    initializeCustomersPage();
    initializeProductsPage();
    initializeReportsPage();
    initializeHistoryPage();
    initializeAnalyticsPage();
    initializeSettings();
    initializeCustomDateFilters();
});

// ============ CUSTOM DATE FILTERS ============
function initializeCustomDateFilters() {
    // Dashboard custom date filter
    const dashboardPeriod = document.getElementById('dashboard-period');
    if (dashboardPeriod) {
        dashboardPeriod.addEventListener('change', function() {
            const customDateDiv = document.getElementById('dashboard-custom-date');
            if (this.value === 'custom') {
                customDateDiv.style.display = 'block';
                setDefaultDateRange('dashboard');
            } else {
                customDateDiv.style.display = 'none';
                loadDashboard();
            }
        });
    }
    
    const dashboardApply = document.getElementById('dashboard-apply-date');
    if (dashboardApply) {
        dashboardApply.addEventListener('click', () => loadDashboard());
    }
    
    const dashboardClear = document.getElementById('dashboard-clear-date');
    if (dashboardClear) {
        dashboardClear.addEventListener('click', () => {
            document.getElementById('dashboard-period').value = 'week';
            document.getElementById('dashboard-custom-date').style.display = 'none';
            loadDashboard();
        });
    }
    
    // History custom date filter
    const historyPeriod = document.getElementById('history-period');
    if (historyPeriod) {
        historyPeriod.addEventListener('change', function() {
            const customDateDiv = document.getElementById('history-custom-date');
            if (this.value === 'custom') {
                customDateDiv.style.display = 'block';
                setDefaultDateRange('history');
            } else {
                customDateDiv.style.display = 'none';
                loadBillingHistory();
            }
        });
    }
    
    const historyApply = document.getElementById('history-apply-date');
    if (historyApply) {
        historyApply.addEventListener('click', () => loadBillingHistory());
    }
    
    const historyClear = document.getElementById('history-clear-date');
    if (historyClear) {
        historyClear.addEventListener('click', () => {
            document.getElementById('history-period').value = 'all';
            document.getElementById('history-custom-date').style.display = 'none';
            loadBillingHistory();
        });
    }
    
    // Analytics custom date filter
    const analyticsPeriod = document.getElementById('analytics-period');
    if (analyticsPeriod) {
        analyticsPeriod.addEventListener('change', function() {
            const customDateDiv = document.getElementById('analytics-custom-date');
            if (this.value === 'custom') {
                customDateDiv.style.display = 'block';
                setDefaultDateRange('analytics');
            } else {
                customDateDiv.style.display = 'none';
                loadAnalytics();
            }
        });
    }
    
    const analyticsApply = document.getElementById('analytics-apply-date');
    if (analyticsApply) {
        analyticsApply.addEventListener('click', () => loadAnalytics());
    }
    
    const analyticsClear = document.getElementById('analytics-clear-date');
    if (analyticsClear) {
        analyticsClear.addEventListener('click', () => {
            document.getElementById('analytics-period').value = 'month';
            document.getElementById('analytics-custom-date').style.display = 'none';
            loadAnalytics();
        });
    }
}

function setDefaultDateRange(page) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Default 30 days ago
    
    const startDateInput = document.getElementById(`${page}-start-date`);
    const endDateInput = document.getElementById(`${page}-end-date`);
    
    if (startDateInput) startDateInput.valueAsDate = startDate;
    if (endDateInput) endDateInput.valueAsDate = endDate;
}

function getCustomDateRange(page) {
    const periodSelect = document.getElementById(`${page}-period`);
    if (!periodSelect || periodSelect.value !== 'custom') {
        return null;
    }
    
    const startDateInput = document.getElementById(`${page}-start-date`);
    const endDateInput = document.getElementById(`${page}-end-date`);
    
    if (!startDateInput || !endDateInput || !startDateInput.value || !endDateInput.value) {
        return null;
    }
    
    return {
        startDate: new Date(startDateInput.value),
        endDate: new Date(endDateInput.value)
    };
}

// ============ LOGIN ============
function initializeLoginForm() {
    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        const result = await window.electronAPI.login({ username, password });
        if (result.success) {
            currentUser = result.user;
            document.getElementById('current-user').textContent = currentUser.username;
            switchScreen('app');
            loadDashboard();
            showToast('Login successful', 'success');
        } else {
            showError('login-error', result.error || 'Invalid credentials');
        }
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
        switchScreen('login');
        currentUser = null;
        showToast('Logged out successfully', 'info');
    });
}

function switchScreen(screen) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(`${screen}-screen`).classList.add('active');
}

// ============ NAVIGATION ============
function initializeNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            
            // Update active nav item
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            // Show page
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.getElementById(`${page}-page`).classList.add('active');

            // Load page data
            loadPageData(page);
        });
    });
}

function loadPageData(page) {
    switch (page) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'billing':
            loadBillingData();
            break;
        case 'customers':
            loadCustomers();
            break;
        case 'crm':
            initializeCRMPage();
            break;
        case 'products':
            loadProducts();
            break;
        case 'categories':
            initializeCategoriesPage();
            break;
        case 'history':
            loadBillingHistory();
            break;
        case 'analytics':
            loadAnalytics();
            break;
        case 'reports':
            loadReports();
            break;
    }
}

// ============ DASHBOARD ============
let paymentChart = null;

async function loadDashboard() {
    const result = await window.electronAPI.getDashboardStats();
    if (result.success) {
        const stats = result.data;
        
        // Update stat cards
        document.getElementById('today-sales').textContent = `₹${stats.todaySales.toFixed(2)}`;
        document.getElementById('today-bills').textContent = stats.todayBills;
        document.getElementById('total-customers').textContent = stats.totalCustomers;
        document.getElementById('total-products').textContent = stats.totalProducts;

        // Update trends (mock data for now, can be enhanced later)
        document.getElementById('sales-trend').textContent = '12%';
        document.getElementById('bills-trend').textContent = '8%';
        
        // Update low stock badge
        document.getElementById('low-stock-badge').textContent = `${stats.lowStockCount} Low Stock`;
        
        // Update total profit display
        const profitElement = document.getElementById('total-profit');
        if (profitElement) {
            profitElement.textContent = `₹${stats.totalProfit.toFixed(2)}`;
        }

        // Load all dashboard components
        loadRecentBills();
        loadSalesChart(stats.salesData);
        loadTopProducts();
        loadPaymentChart();
    }
}

async function getLowStockCount() {
    const result = await window.electronAPI.products.getAll();
    if (result.success) {
        return result.data.filter(p => p.stock <= 10).length;
    }
    return 0;
}

async function loadRecentBills() {
    const result = await window.electronAPI.bills.getAll();
    if (result.success) {
        const billsList = document.getElementById('recent-bills-list');
        const recentBills = result.data.slice(0, 5);
        
        if (recentBills.length === 0) {
            billsList.innerHTML = '<p style="color: #999; text-align: center; padding: 40px;">No bills yet</p>';
        } else {
            billsList.innerHTML = recentBills.map(bill => {
                const date = new Date(bill.date);
                const timeAgo = getTimeAgo(date);
                return `
                <div class="recent-item">
                    <div class="recent-item-info">
                        <h4>Bill #${bill.id}</h4>
                        <p>${bill.customer_name} • ${bill.payment_mode.toUpperCase()}</p>
                    </div>
                    <div class="recent-item-amount">
                        <span class="amount">₹${bill.total.toFixed(2)}</span>
                        <span class="time">${timeAgo}</span>
                    </div>
                </div>
            `;
            }).join('');
        }
    }
}

async function loadTopProducts() {
    const result = await window.electronAPI.reports.getSales({ period: 'month' });
    if (result.success && result.data.topProducts) {
        const topList = document.getElementById('top-products-list');
        const topProducts = result.data.topProducts.slice(0, 5);
        
        if (topProducts.length === 0) {
            topList.innerHTML = '<p style="color: #999; text-align: center; padding: 40px;">No products sold yet</p>';
        } else {
            topList.innerHTML = topProducts.map((product, index) => `
                <div class="top-item">
                    <div class="top-item-info">
                        <div class="top-item-rank">${index + 1}</div>
                        <div class="top-item-details">
                            <h4>${product.product_name}</h4>
                            <p>${product.quantity_sold} units sold</p>
                        </div>
                    </div>
                    <div class="top-item-value">₹${product.total_revenue.toFixed(2)}</div>
                </div>
            `).join('');
        }
    }
}

async function loadPaymentChart() {
    const result = await window.electronAPI.reports.getSales({ period: 'month' });
    if (result.success && result.data.paymentMethods) {
        const ctx = document.getElementById('payment-chart');
        
        if (paymentChart) {
            paymentChart.destroy();
        }

        const paymentData = result.data.paymentMethods;
        const labels = paymentData.map(p => p.payment_mode.toUpperCase());
        const values = paymentData.map(p => p.count);
        const colors = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336'];

        paymentChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        });
    }
}

function loadSalesChart(data) {
    const ctx = document.getElementById('sales-chart');
    if (salesChart) {
        salesChart.destroy();
    }

    salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data ? data.labels : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Sales (₹)',
                data: data ? data.values : [0, 0, 0, 0, 0, 0, 0],
                borderColor: '#2196F3',
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                tension: 0.4,
                fill: true,
                borderWidth: 3,
                pointRadius: 5,
                pointBackgroundColor: '#2196F3',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: {
                            size: 14,
                            weight: '600'
                        },
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        label: function(context) {
                            return 'Sales: ₹' + context.parsed.y.toFixed(2);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '₹' + value;
                        },
                        font: {
                            size: 12
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 12
                        }
                    }
                }
            }
        }
    });
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            return interval + ' ' + unit + (interval === 1 ? '' : 's') + ' ago';
        }
    }
    return 'Just now';
}

function refreshChart() {
    loadDashboard();
}

window.refreshChart = refreshChart;

document.getElementById('refresh-dashboard').addEventListener('click', loadDashboard);

// ============ BILLING PAGE ============
let currentCategory = 'all';
let searchQuery = '';

function initializeBillingPage() {
    // Load category tabs first
    loadBillingCategoryTabs();
    
    // Product search
    const searchInput = document.getElementById('product-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase();
            loadProductsGrid();
        });
    }

    // Place order button
    document.getElementById('generate-bill-btn').addEventListener('click', generateBill);
    document.getElementById('add-customer-quick').addEventListener('click', () => openCustomerModalFromBilling());

    // Discount input change
    const discountInput = document.getElementById('bill-discount');
    if (discountInput) {
        discountInput.addEventListener('input', updateBillSummary);
    }
}

function loadBillingCategoryTabs() {
    const categoryTabsContainer = document.getElementById('category-tabs');
    if (!categoryTabsContainer) return;
    
    // Get categories from localStorage
    const savedCategories = localStorage.getItem('categories');
    const categories = savedCategories ? JSON.parse(savedCategories) : [];
    
    // Build category tabs HTML
    let tabsHTML = `
        <button class="category-tab active" data-category="all">
            <i class="fas fa-th"></i> All Items
        </button>
    `;
    
    categories.forEach(category => {
        tabsHTML += `
            <button class="category-tab" data-category="${category.name}">
                <i class="fas ${category.icon}"></i> ${category.name}
            </button>
        `;
    });
    
    categoryTabsContainer.innerHTML = tabsHTML;
    
    // Add click event listeners to category tabs
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
            e.currentTarget.classList.add('active');
            currentCategory = e.currentTarget.dataset.category;
            loadProductsGrid();
        });
    });
}

async function loadBillingData() {
    // Load customers
    const customersResult = await window.electronAPI.customers.getAll();
    if (customersResult.success) {
        allCustomers = customersResult.data;
        const customerSelect = document.getElementById('bill-customer');
        customerSelect.innerHTML = '<option value="">Select Customer</option>' +
            allCustomers.map(c => `<option value="${c.id}">${c.name} - ${c.phone}</option>`).join('');
    }

    // Load products and render grid
    const productsResult = await window.electronAPI.products.getAll();
    if (productsResult.success) {
        allProducts = productsResult.data;
        loadProductsGrid();
    }
}

function loadProductsGrid() {
    const productsGrid = document.getElementById('products-grid');
    if (!productsGrid) return;

    // Filter products by category and search
    let filteredProducts = allProducts;
    
    if (currentCategory !== 'all') {
        filteredProducts = filteredProducts.filter(p => 
            (p.category || 'Others').toLowerCase() === currentCategory.toLowerCase()
        );
    }

    if (searchQuery) {
        filteredProducts = filteredProducts.filter(p => 
            p.name.toLowerCase().includes(searchQuery)
        );
    }

    if (filteredProducts.length === 0) {
        productsGrid.innerHTML = '<div class="empty-state-text">No products found</div>';
        return;
    }

    const placeholderImage = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="%23e0e0e0"><rect width="200" height="200" fill="%23f5f5f5"/><path d="M150 100l-30 40H80l-30-40 30-40h40z" fill="%23ccc"/></svg>';

    productsGrid.innerHTML = filteredProducts.map(product => {
        const isOutOfStock = product.stock <= 0;
        const imageUrl = product.image || placeholderImage;
        const rating = (Math.random() * 2 + 3).toFixed(1);
        
        // Create badge HTML
        let badgeHtml = '';
        if (isOutOfStock) {
            badgeHtml = '<span class="stock-badge out">Out of Stock</span>';
        } else if (product.stock < 10) {
            badgeHtml = '<span class="stock-badge low">Low Stock</span>';
        } else {
            badgeHtml = `<span class="stock-badge in">★ ${rating}</span>`;
        }
        
        return `
            <div class="product-card ${isOutOfStock ? 'out-of-stock' : ''}" 
                 data-product-id="${product.id}"
                 onclick="addProductToBill(${product.id})">
                ${badgeHtml}
                <div class="product-image-box">
                    <img src="${imageUrl}" alt="${product.name}">
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <div class="product-price">₹${product.price.toFixed(2)}</div>
                </div>
            </div>
        `;
    }).join('');
    
    // Add error handlers to images after rendering
    const images = productsGrid.querySelectorAll('img');
    images.forEach(img => {
        img.onerror = function() {
            this.src = placeholderImage;
        };
    });
}

function addProductToBill(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    if (product.stock <= 0) {
        showToast('Product is out of stock', 'error');
        return;
    }

    // Check if product already in bill
    const existing = billItems.find(item => item.product_id === productId);
    if (existing) {
        if (existing.quantity >= product.stock) {
            showToast('Cannot add more than available stock', 'error');
            return;
        }
        existing.quantity += 1;
    } else {
        billItems.push({
            product_id: productId,
            name: product.name,
            price: product.price,
            tax: product.tax,
            quantity: 1,
            image: product.image,
            stock: product.stock
        });
    }

    renderBillItems();
    updateBillSummary();
}

function toggleFavorite(productId) {
    // Toggle favorite functionality (could be saved to localStorage or database)
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const index = favorites.indexOf(productId);
    
    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        favorites.push(productId);
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
    loadProductsGrid(); // Refresh to update UI
}

function renderBillItems() {
    const billItemsList = document.getElementById('bill-items-list');
    
    if (!billItemsList) return;

    if (billItems.length === 0) {
        billItemsList.innerHTML = '<div class="empty-bill-message">No items added to order</div>';
        return;
    }

    const placeholderImage = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="%23e0e0e0"><rect width="200" height="200" fill="%23f5f5f5"/><path d="M150 100l-30 40H80l-30-40 30-40h40z" fill="%23ccc"/></svg>';

    billItemsList.innerHTML = billItems.map((item, index) => {
        const imageUrl = item.image || placeholderImage;
        const itemTotal = item.price * item.quantity;
        
        return `
            <div class="bill-item-card">
                <img src="${imageUrl}" alt="${item.name}" class="bill-item-image">
                <div class="bill-item-info">
                    <div class="bill-item-name">${item.name}</div>
                    <div class="bill-item-price">₹${item.price.toFixed(2)}</div>
                </div>
                <div class="bill-item-actions">
                    <div class="quantity-control">
                        <button class="qty-btn" onclick="decrementQuantity(${index})">-</button>
                        <span class="qty-value">${item.quantity}</span>
                        <button class="qty-btn" onclick="incrementQuantity(${index})">+</button>
                    </div>
                    <div class="bill-item-total">₹${itemTotal.toFixed(2)}</div>
                </div>
                <button class="remove-item-btn" onclick="removeFromBill(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }).join('');
    
    // Add error handlers to images after rendering
    const images = billItemsList.querySelectorAll('img');
    images.forEach(img => {
        img.onerror = function() {
            this.src = placeholderImage;
        };
    });
}

function incrementQuantity(index) {
    const item = billItems[index];
    const product = allProducts.find(p => p.id === item.product_id);
    
    if (item.quantity >= product.stock) {
        showToast('Cannot exceed available stock', 'error');
        return;
    }
    
    item.quantity++;
    renderBillItems();
    updateBillSummary();
}

function decrementQuantity(index) {
    const item = billItems[index];
    
    if (item.quantity <= 1) {
        return;
    }
    
    item.quantity--;
    renderBillItems();
    updateBillSummary();
}

function removeFromBill(index) {
    billItems.splice(index, 1);
    renderBillItems();
    updateBillSummary();
}

function updateBillSummary() {
    let subtotal = 0;
    let tax = 0;

    // Check if all taxes are enabled
    const settings = JSON.parse(localStorage.getItem('businessSettings') || '{}');
    const isAllTaxesEnabled = settings.enableAllTaxes !== undefined ? settings.enableAllTaxes : true;

    if (isAllTaxesEnabled) {
        // Calculate product-specific taxes
        billItems.forEach(item => {
            const itemSubtotal = item.price * item.quantity;
            const itemTax = (itemSubtotal * item.tax) / 100;
            subtotal += itemSubtotal;
            tax += itemTax;
        });

        // Get default tax percentage from settings (only if enabled)
        const isDefaultTaxEnabled = settings.enableDefaultTax || false;
        const defaultTaxPercentage = isDefaultTaxEnabled ? (parseFloat(settings.defaultTaxPercentage) || 0) : 0;
        
        // Add default tax to subtotal only if enabled
        const defaultTax = (subtotal * defaultTaxPercentage) / 100;
        tax += defaultTax;
    } else {
        // If all taxes disabled, just calculate subtotal without any taxes
        billItems.forEach(item => {
            const itemSubtotal = item.price * item.quantity;
            subtotal += itemSubtotal;
        });
        tax = 0;
    }

    // Show/hide tax row based on whether there's any tax
    const taxRow = document.getElementById('tax-row');
    if (taxRow) {
        if (tax > 0) {
            taxRow.style.display = 'flex';
        } else {
            taxRow.style.display = 'none';
        }
    }

    // Update tax info label
    const taxInfoLabel = document.getElementById('tax-info-label');
    if (taxInfoLabel && isAllTaxesEnabled) {
        const isDefaultTaxEnabled = settings.enableDefaultTax || false;
        const defaultTaxPercentage = isDefaultTaxEnabled ? (parseFloat(settings.defaultTaxPercentage) || 0) : 0;
        if (isDefaultTaxEnabled && defaultTaxPercentage > 0) {
            taxInfoLabel.textContent = `(incl. ${defaultTaxPercentage}% default tax)`;
        } else {
            taxInfoLabel.textContent = '';
        }
    } else if (taxInfoLabel) {
        taxInfoLabel.textContent = '';
    }

    // Get discount value
    const discountInput = document.getElementById('bill-discount');
    const discount = discountInput ? parseFloat(discountInput.value) || 0 : 0;

    const total = subtotal + tax - discount;

    // Update display
    const subtotalEl = document.getElementById('bill-subtotal');
    const taxEl = document.getElementById('bill-tax');
    const discountEl = document.getElementById('bill-discount-amount');
    const totalEl = document.getElementById('bill-total');

    if (subtotalEl) subtotalEl.textContent = `₹${subtotal.toFixed(2)}`;
    if (taxEl) taxEl.textContent = `₹${tax.toFixed(2)}`;
    if (discountEl) discountEl.textContent = `₹${discount.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `₹${total.toFixed(2)}`;
}

async function generateBill() {
    const customerId = document.getElementById('bill-customer').value;
    const paymentMode = document.getElementById('payment-mode').value;

    if (!customerId) {
        showToast('Please select a customer', 'error');
        return;
    }

    if (billItems.length === 0) {
        showToast('Please add products to the bill', 'error');
        return;
    }

    // Calculate totals respecting tax settings
    let subtotal = 0;
    let tax = 0;

    const settings = JSON.parse(localStorage.getItem('businessSettings') || '{}');
    const isAllTaxesEnabled = settings.enableAllTaxes !== undefined ? settings.enableAllTaxes : true;

    if (isAllTaxesEnabled) {
        // Calculate product-specific taxes
        billItems.forEach(item => {
            const itemSubtotal = item.price * item.quantity;
            const itemTax = (itemSubtotal * item.tax) / 100;
            subtotal += itemSubtotal;
            tax += itemTax;
        });

        // Add default tax if enabled
        const isDefaultTaxEnabled = settings.enableDefaultTax || false;
        const defaultTaxPercentage = isDefaultTaxEnabled ? (parseFloat(settings.defaultTaxPercentage) || 0) : 0;
        const defaultTax = (subtotal * defaultTaxPercentage) / 100;
        tax += defaultTax;
    } else {
        // If all taxes disabled, just calculate subtotal without any taxes
        billItems.forEach(item => {
            const itemSubtotal = item.price * item.quantity;
            subtotal += itemSubtotal;
        });
        tax = 0; // Force tax to 0 when disabled
    }

    const discountInput = document.getElementById('bill-discount');
    const discount = parseFloat(discountInput?.value || 0);

    const billData = {
        customer_id: parseInt(customerId),
        payment_mode: paymentMode,
        items: billItems,
        subtotal: subtotal,
        tax: tax,
        discount: discount
    };

    const result = await window.electronAPI.bills.create(billData);
    if (result.success) {
        const billId = result.billId;
        
        // Get customer phone
        const customer = allCustomers.find(c => c.id === parseInt(customerId));
        const customerPhone = customer ? customer.phone : '';
        
        // Show options modal
        showBillSuccessModal(billId, customerPhone);
        
        // Clear bill
        clearBill();
        
        // Reload dashboard if visible
        if (document.getElementById('dashboard-page').classList.contains('active')) {
            loadDashboard();
        }
    } else {
        showToast(result.error || 'Failed to generate bill', 'error');
    }
}

function showBillSuccessModal(billId, customerPhone) {
    const modalHTML = `
        <div class="modal-overlay">
            <div class="modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2><i class="fas fa-check-circle" style="color: #4CAF50;"></i> Bill Generated Successfully!</h2>
                </div>
                <div class="modal-body" style="text-align: center; padding: 30px;">
                    <div style="font-size: 48px; color: #4CAF50; margin-bottom: 20px;">
                        <i class="fas fa-receipt"></i>
                    </div>
                    <h3 style="margin-bottom: 10px;">Bill #${billId}</h3>
                    <p style="color: #666; margin-bottom: 30px;">What would you like to do next?</p>
                    
                    <div style="display: flex; flex-direction: column; gap: 15px;">
                        <button class="btn btn-success btn-lg" onclick="sendBillOnWhatsApp(${billId}, '${customerPhone}'); closeModal();" style="width: 100%;">
                            <i class="fab fa-whatsapp"></i> Send on WhatsApp
                        </button>
                        <button class="btn btn-info btn-lg" onclick="printBill(${billId}); closeModal();" style="width: 100%;">
                            <i class="fas fa-print"></i> Print Bill
                        </button>
                        <button class="btn btn-secondary" onclick="closeModal();" style="width: 100%;">
                            <i class="fas fa-times"></i> Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    showModal(modalHTML);
}

function clearBill() {
    billItems = [];
    document.getElementById('bill-customer').value = '';
    document.getElementById('payment-mode').value = 'cash';
    
    const discountInput = document.getElementById('bill-discount');
    if (discountInput) discountInput.value = '0';
    
    renderBillItems();
    updateBillSummary();
}

// Make billing functions available globally
window.removeFromBill = removeFromBill;
window.incrementQuantity = incrementQuantity;
window.decrementQuantity = decrementQuantity;

// ============ CUSTOMERS PAGE ============
function initializeCustomersPage() {
    document.getElementById('add-customer-btn').addEventListener('click', () => openCustomerModal());
    document.getElementById('search-customers').addEventListener('input', searchCustomers);
}

async function loadCustomers() {
    const result = await window.electronAPI.customers.getAll();
    if (result.success) {
        allCustomers = result.data;
        renderCustomers(allCustomers);
    }
}

function renderCustomers(customers) {
    const tbody = document.getElementById('customers-body');
    
    if (customers.length === 0) {
        tbody.innerHTML = '<tr class="empty-state"><td colspan="6">No customers found</td></tr>';
        return;
    }

    tbody.innerHTML = customers.map(customer => `
        <tr>
            <td>${customer.id}</td>
            <td>${customer.name}</td>
            <td>${customer.phone}</td>
            <td>${customer.email || '-'}</td>
            <td>${customer.address || '-'}</td>
            <td class="action-btns">
                <button class="btn btn-sm btn-primary" onclick="openCustomerModal(${customer.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteCustomer(${customer.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

async function searchCustomers(e) {
    const query = e.target.value;
    if (query.length === 0) {
        renderCustomers(allCustomers);
        return;
    }

    const result = await window.electronAPI.customers.search(query);
    if (result.success) {
        renderCustomers(result.data);
    }
}

function openCustomerModal(customerId = null) {
    const customer = customerId ? allCustomers.find(c => c.id === customerId) : null;
    
    const modal = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2>${customer ? 'Edit Customer' : 'Add Customer'}</h2>
                    <button class="modal-close" onclick="closeModal()">×</button>
                </div>
                <form id="customer-form">
                    <div class="form-group">
                        <label>Name *</label>
                        <input type="text" id="customer-name" value="${customer?.name || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Phone *</label>
                        <input type="tel" id="customer-phone" value="${customer?.phone || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="customer-email" value="${customer?.email || ''}">
                    </div>
                    <div class="form-group">
                        <label>Address</label>
                        <textarea id="customer-address" rows="3">${customer?.address || ''}</textarea>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                        <button type="submit" class="btn btn-primary">
                            ${customer ? 'Update' : 'Add'} Customer
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.getElementById('modal-container').innerHTML = modal;

    document.getElementById('customer-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const customerData = {
            name: document.getElementById('customer-name').value,
            phone: document.getElementById('customer-phone').value,
            email: document.getElementById('customer-email').value,
            address: document.getElementById('customer-address').value
        };

        let result;
        if (customer) {
            result = await window.electronAPI.customers.update(customer.id, customerData);
        } else {
            result = await window.electronAPI.customers.add(customerData);
        }

        if (result.success) {
            showToast(`Customer ${customer ? 'updated' : 'added'} successfully`, 'success');
            closeModal();
            loadCustomers();
        } else {
            showToast(result.error || 'Operation failed', 'error');
        }
    });
}

async function deleteCustomer(id) {
    if (!confirm('Are you sure you want to delete this customer?')) return;

    const result = await window.electronAPI.customers.delete(id);
    if (result.success) {
        showToast('Customer deleted successfully', 'success');
        loadCustomers();
    } else {
        showToast(result.error || 'Failed to delete customer', 'error');
    }
}

// Make functions available globally
window.openCustomerModal = openCustomerModal;

// Open customer modal from billing page
function openCustomerModalFromBilling() {
    const modal = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2>Add Customer</h2>
                    <button class="modal-close" onclick="closeModal()">×</button>
                </div>
                <form id="customer-form-billing">
                    <div class="form-group">
                        <label>Name *</label>
                        <input type="text" id="customer-name" required>
                    </div>
                    <div class="form-group">
                        <label>Phone *</label>
                        <input type="tel" id="customer-phone" required>
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="customer-email">
                    </div>
                    <div class="form-group">
                        <label>Address</label>
                        <textarea id="customer-address" rows="3"></textarea>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                        <button type="submit" class="btn btn-primary">
                            Add Customer
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.getElementById('modal-container').innerHTML = modal;

    document.getElementById('customer-form-billing').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const customerData = {
            name: document.getElementById('customer-name').value,
            phone: document.getElementById('customer-phone').value,
            email: document.getElementById('customer-email').value,
            address: document.getElementById('customer-address').value
        };

        const result = await window.electronAPI.customers.add(customerData);

        if (result.success) {
            showToast('Customer added successfully', 'success');
            closeModal();
            
            // Reload billing data to update customer dropdown
            await loadBillingData();
            
            // Auto-select the newly added customer
            const customerSelect = document.getElementById('bill-customer');
            customerSelect.value = result.id;
        } else {
            showToast(result.error || 'Operation failed', 'error');
        }
    });
}
window.deleteCustomer = deleteCustomer;

// ============ PRODUCTS PAGE ============
function initializeProductsPage() {
    document.getElementById('add-product-btn').addEventListener('click', () => openProductModal());
    document.getElementById('search-products').addEventListener('input', searchProducts);
}

async function loadProducts() {
    const result = await window.electronAPI.products.getAll();
    if (result.success) {
        allProducts = result.data;
        
        // Load and populate category filter
        const savedCategories = localStorage.getItem('categories');
        const categories = savedCategories ? JSON.parse(savedCategories) : getDefaultCategories();
        
        const filterSelect = document.getElementById('filter-category');
        if (filterSelect) {
            const categoryOptions = categories.map(cat => 
                `<option value="${cat.name}">${cat.name}</option>`
            ).join('');
            filterSelect.innerHTML = `<option value="all">All Categories</option>${categoryOptions}<option value="Others">Others</option>`;
            
            // Add filter event listener
            filterSelect.addEventListener('change', filterProductsByCategory);
        }
        
        renderProducts(allProducts);
    }
}

function filterProductsByCategory() {
    const selectedCategory = document.getElementById('filter-category')?.value;
    
    if (selectedCategory === 'all') {
        renderProducts(allProducts);
    } else {
        const filtered = allProducts.filter(p => p.category === selectedCategory);
        renderProducts(filtered);
    }
}

function renderProducts(products) {
    const tbody = document.getElementById('products-body');
    
    if (products.length === 0) {
        tbody.innerHTML = '<tr class="empty-state"><td colspan="11">No products found</td></tr>';
        return;
    }

    tbody.innerHTML = products.map(product => {
        const costPrice = product.cost_price || 0;
        const sellingPrice = product.price || 0;
        const profit = sellingPrice - costPrice;
        const profitMargin = costPrice > 0 ? ((profit / costPrice) * 100).toFixed(1) : 0;
        
        // Get category color from categories
        const savedCategories = localStorage.getItem('categories');
        const categories = savedCategories ? JSON.parse(savedCategories) : [];
        const categoryObj = categories.find(c => c.name === product.category);
        const categoryColor = categoryObj ? categoryObj.color.start : '#2196F3';
        
        return `
        <tr>
            <td>
                ${product.image 
                    ? `<img src="${product.image}" alt="${product.name}" class="product-thumbnail">` 
                    : '<div class="product-thumbnail-placeholder"><i class="fas fa-image"></i></div>'}
            </td>
            <td>${product.id}</td>
            <td>${product.name}</td>
            <td>
                <span class="category-badge" style="background: ${categoryColor}20; color: ${categoryColor}; border: 1px solid ${categoryColor};">
                    ${product.category || 'Others'}
                </span>
            </td>
            <td>₹${costPrice.toFixed(2)}</td>
            <td>₹${sellingPrice.toFixed(2)}</td>
            <td>
                <span style="color: ${profit > 0 ? '#4CAF50' : '#F44336'}; font-weight: 600;">
                    ₹${profit.toFixed(2)} (${profitMargin}%)
                </span>
            </td>
            <td>${product.tax}%</td>
            <td>${product.stock}</td>
            <td>
                <span class="badge ${product.stock > 10 ? 'badge-success' : product.stock > 0 ? 'badge-warning' : 'badge-danger'}">
                    ${product.stock > 10 ? 'In Stock' : product.stock > 0 ? 'Low Stock' : 'Out of Stock'}
                </span>
            </td>
            <td class="action-btns">
                <button class="btn btn-sm btn-primary" onclick="openProductModal(${product.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteProduct(${product.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `;
    }).join('');
}

async function searchProducts(e) {
    const query = e.target.value;
    if (query.length === 0) {
        renderProducts(allProducts);
        return;
    }

    const result = await window.electronAPI.products.search(query);
    if (result.success) {
        renderProducts(result.data);
    }
}

function openProductModal(productId = null) {
    const product = productId ? allProducts.find(p => p.id === productId) : null;
    
    // Load categories from localStorage
    const savedCategories = localStorage.getItem('categories');
    const categories = savedCategories ? JSON.parse(savedCategories) : getDefaultCategories();
    
    // Generate category options dynamically
    const categoryOptions = categories.map(cat => 
        `<option value="${cat.name}" ${product?.category === cat.name ? 'selected' : ''}>${cat.name}</option>`
    ).join('');
    
    const modal = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2>${product ? 'Edit Product' : 'Add Product'}</h2>
                    <button class="modal-close" onclick="closeModal()">×</button>
                </div>
                <form id="product-form">
                    <div class="form-group">
                        <label>Product Image</label>
                        <div class="image-upload-container">
                            <div id="image-preview" class="image-preview">
                                ${product?.image 
                                    ? `<img src="${product.image}" alt="Product">` 
                                    : '<div class="image-placeholder"><i class="fas fa-image"></i><p>No image selected</p></div>'}
                            </div>
                            <button type="button" id="select-image-btn" class="btn btn-secondary btn-sm">
                                <i class="fas fa-upload"></i> Select Image
                            </button>
                            <input type="hidden" id="product-image" value="${product?.image || ''}">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Product Name *</label>
                        <input type="text" id="product-name" value="${product?.name || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Category *</label>
                        <select id="product-category" required>
                            ${categoryOptions}
                            <option value="Others" ${product?.category === 'Others' || !product?.category ? 'selected' : ''}>Others</option>
                        </select>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Buying Cost (Cost Price) *</label>
                            <input type="number" id="product-cost-price" value="${product?.cost_price || ''}" step="0.01" required placeholder="₹0.00">
                        </div>
                        <div class="form-group">
                            <label>Selling Price *</label>
                            <input type="number" id="product-price" value="${product?.price || ''}" step="0.01" required placeholder="₹0.00">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Tax (%) *</label>
                            <input type="number" id="product-tax" value="${product?.tax || '0'}" step="0.01" required>
                        </div>
                        <div class="form-group">
                            <label>Stock Quantity *</label>
                            <input type="number" id="product-stock" value="${product?.stock || '0'}" required>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                        <button type="submit" class="btn btn-primary">
                            ${product ? 'Update' : 'Add'} Product
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.getElementById('modal-container').innerHTML = modal;

    // Image selection handler
    document.getElementById('select-image-btn').addEventListener('click', async () => {
        const result = await window.electronAPI.selectImage();
        if (result.success) {
            document.getElementById('product-image').value = result.image;
            document.getElementById('image-preview').innerHTML = `<img src="${result.image}" alt="Product">`;
        }
    });

    document.getElementById('product-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const costPrice = parseFloat(document.getElementById('product-cost-price').value);
        const sellingPrice = parseFloat(document.getElementById('product-price').value);
        
        // Validate that selling price is greater than cost price
        if (sellingPrice <= costPrice) {
            showToast('Selling price must be greater than cost price!', 'error');
            return;
        }
        
        const productData = {
            name: document.getElementById('product-name').value,
            category: document.getElementById('product-category').value,
            cost_price: costPrice,
            price: sellingPrice,
            tax: parseFloat(document.getElementById('product-tax').value),
            stock: parseInt(document.getElementById('product-stock').value),
            image: document.getElementById('product-image').value || null
        };

        let result;
        if (product) {
            result = await window.electronAPI.products.update(product.id, productData);
        } else {
            result = await window.electronAPI.products.add(productData);
        }

        if (result.success) {
            const profit = sellingPrice - costPrice;
            const profitMargin = ((profit / costPrice) * 100).toFixed(1);
            showToast(`Product ${product ? 'updated' : 'added'} successfully! Profit: ₹${profit.toFixed(2)} (${profitMargin}% margin)`, 'success');
            closeModal();
            loadProducts();
        } else {
            showToast(result.error || 'Operation failed', 'error');
        }
    });
}

async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    const result = await window.electronAPI.products.delete(id);
    if (result.success) {
        showToast('Product deleted successfully', 'success');
        loadProducts();
    } else {
        showToast(result.error || 'Failed to delete product', 'error');
    }
}

window.openProductModal = openProductModal;
window.deleteProduct = deleteProduct;

// ============ BILLING HISTORY PAGE ============
let allBills = [];

function initializeHistoryPage() {
    const historyPeriod = document.getElementById('history-period');
    if (historyPeriod) {
        historyPeriod.addEventListener('change', loadBillingHistory);
    }

    const searchHistory = document.getElementById('search-history');
    if (searchHistory) {
        searchHistory.addEventListener('input', filterBillingHistory);
    }

    const refreshBtn = document.getElementById('refresh-history-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadBillingHistory);
    }
}

async function loadBillingHistory() {
    try {
        const result = await window.electronAPI.bills.getAll();
        if (result.success) {
            allBills = result.data;
            const period = document.getElementById('history-period')?.value || 'all';
            
            // Filter by period
            let filteredBills = allBills;
            
            // Check for custom date range
            const customRange = getCustomDateRange('history');
            if (customRange) {
                const endDate = new Date(customRange.endDate);
                endDate.setHours(23, 59, 59, 999);
                filteredBills = allBills.filter(bill => {
                    const billDate = new Date(bill.date);
                    return billDate >= customRange.startDate && billDate <= endDate;
                });
            } else if (period !== 'all') {
                const now = new Date();
                let startDate;
                
                switch(period) {
                    case 'today':
                        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                        break;
                    case 'week':
                        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        break;
                    case 'month':
                        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                        break;
                    case 'year':
                        startDate = new Date(now.getFullYear(), 0, 1);
                        break;
                }
                
                if (startDate) {
                    filteredBills = allBills.filter(bill => new Date(bill.date) >= startDate);
                }
            }
            
            renderBillingHistory(filteredBills);
        }
    } catch (error) {
        console.error('Error loading billing history:', error);
        showToast('Failed to load billing history', 'error');
    }
}

function filterBillingHistory() {
    const searchTerm = document.getElementById('search-history')?.value.toLowerCase() || '';
    
    if (!searchTerm) {
        loadBillingHistory();
        return;
    }
    
    const filtered = allBills.filter(bill => 
        bill.id.toString().includes(searchTerm) ||
        bill.customer_name.toLowerCase().includes(searchTerm) ||
        bill.customer_phone.includes(searchTerm)
    );
    
    renderBillingHistory(filtered);
}

function renderBillingHistory(bills) {
    const tbody = document.getElementById('history-body');
    
    if (!tbody) return;
    
    if (bills.length === 0) {
        tbody.innerHTML = '<tr class="empty-state"><td colspan="7">No bills found</td></tr>';
        return;
    }
    
    tbody.innerHTML = bills.map(bill => {
        const date = new Date(bill.date);
        const formattedDate = date.toLocaleDateString('en-IN', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
        });
        const formattedTime = date.toLocaleTimeString('en-IN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        const paymentBadgeColor = {
            'cash': '#4CAF50',
            'upi': '#2196F3',
            'card': '#FF9800',
            'cheque': '#9C27B0'
        };
        
        return `
            <tr onclick="viewBillDetails(${bill.id})" style="cursor: pointer;">
                <td><strong>#${bill.id}</strong></td>
                <td>
                    <div>${formattedDate}</div>
                    <small style="color: #666;">${formattedTime}</small>
                </td>
                <td>
                    <div>${bill.customer_name}</div>
                    <small style="color: #666;">${bill.customer_phone}</small>
                </td>
                <td>-</td>
                <td>
                    <span class="badge" style="background: ${paymentBadgeColor[bill.payment_mode] || '#666'}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 0.85em;">
                        ${bill.payment_mode.toUpperCase()}
                    </span>
                </td>
                <td><strong style="color: #4CAF50;">₹${bill.total.toFixed(2)}</strong></td>
                <td class="action-btns">
                    <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); viewBillDetails(${bill.id})" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-success" onclick="event.stopPropagation(); sendBillOnWhatsApp(${bill.id}, '${bill.customer_phone}')" title="Send on WhatsApp">
                        <i class="fab fa-whatsapp"></i>
                    </button>
                    <button class="btn btn-sm btn-info" onclick="event.stopPropagation(); printBill(${bill.id})" title="Print Bill">
                        <i class="fas fa-print"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

async function viewBillDetails(billId) {
    try {
        const result = await window.electronAPI.bills.getById(billId);
        
        if (!result.success) {
            showToast('Failed to load bill details', 'error');
            return;
        }
        
        const bill = result.data;
        const date = new Date(bill.date);
        const formattedDate = date.toLocaleDateString('en-IN', { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const itemsHTML = bill.items.map((item, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${item.product_name}</td>
                <td>${item.quantity}</td>
                <td>₹${item.price.toFixed(2)}</td>
                <td>${item.tax}%</td>
                <td><strong>₹${item.total.toFixed(2)}</strong></td>
            </tr>
        `).join('');
        
        const modalHTML = `
            <div class="modal-overlay">
                <div class="modal modal-large" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h2><i class="fas fa-file-invoice"></i> Bill Details - #${bill.id}</h2>
                        <button class="modal-close" onclick="closeModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="bill-details-container">
                            <div class="bill-info-grid">
                                <div class="bill-info-item">
                                    <label><i class="fas fa-calendar"></i> Date & Time</label>
                                    <div>${formattedDate}</div>
                                </div>
                                <div class="bill-info-item">
                                    <label><i class="fas fa-user"></i> Customer</label>
                                    <div>${bill.customer_name}</div>
                                    <small>${bill.customer_phone}</small>
                                </div>
                                <div class="bill-info-item">
                                    <label><i class="fas fa-credit-card"></i> Payment Method</label>
                                    <div>${bill.payment_mode.toUpperCase()}</div>
                                </div>
                                <div class="bill-info-item">
                                    <label><i class="fas fa-receipt"></i> Bill Number</label>
                                    <div><strong>#${bill.id}</strong></div>
                                </div>
                            </div>
                            
                            <h3 style="margin-top: 30px; margin-bottom: 15px;"><i class="fas fa-shopping-cart"></i> Items</h3>
                            <table class="bill-items-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Product</th>
                                        <th>Qty</th>
                                        <th>Price</th>
                                        <th>Tax</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${itemsHTML}
                                </tbody>
                            </table>
                            
                            <div class="bill-summary-box">
                                <div class="summary-row">
                                    <span>Subtotal:</span>
                                    <span>₹${bill.subtotal.toFixed(2)}</span>
                                </div>
                                ${bill.tax > 0 ? `
                                <div class="summary-row">
                                    <span>Tax:</span>
                                    <span>₹${bill.tax.toFixed(2)}</span>
                                </div>
                                ` : ''}
                                ${bill.discount > 0 ? `
                                <div class="summary-row">
                                    <span>Discount:</span>
                                    <span style="color: #F44336;">-₹${bill.discount.toFixed(2)}</span>
                                </div>
                                ` : ''}
                                <div class="summary-row total-row">
                                    <span><strong>Total Amount:</strong></span>
                                    <span><strong style="color: #4CAF50; font-size: 1.3em;">₹${bill.total.toFixed(2)}</strong></span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="closeModal()">Close</button>
                        <button class="btn btn-success" onclick="sendBillOnWhatsApp(${bill.id}, '${bill.customer_phone}'); closeModal();">
                            <i class="fab fa-whatsapp"></i> Send on WhatsApp
                        </button>
                        <button class="btn btn-info" onclick="printBill(${bill.id}); closeModal();">
                            <i class="fas fa-print"></i> Print Bill
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        showModal(modalHTML);
        
    } catch (error) {
        console.error('Error viewing bill details:', error);
        showToast('Failed to load bill details', 'error');
    }
}

async function printBill(billId) {
    try {
        const result = await window.electronAPI.bills.getById(billId);
        
        if (!result.success) {
            showToast('Failed to load bill', 'error');
            return;
        }
        
        // Open the PDF
        if (result.pdfPath) {
            await window.electronAPI.invoice.open(result.pdfPath);
            showToast('Opening bill...', 'info');
        } else {
            showToast('Bill PDF not found', 'error');
        }
        
    } catch (error) {
        console.error('Error printing bill:', error);
        showToast('Failed to print bill', 'error');
    }
}

async function sendBillOnWhatsApp(billId, phoneNumber) {
    try {
        if (!phoneNumber) {
            showToast('Customer phone number not available', 'error');
            return;
        }
        
        const result = await window.electronAPI.whatsapp.sendBill({
            billId: billId,
            phoneNumber: phoneNumber
        });
        
        if (result.success) {
            showToast('Opening WhatsApp...', 'success');
        } else {
            showToast(result.error || 'Failed to send on WhatsApp', 'error');
        }
        
    } catch (error) {
        console.error('Error sending bill on WhatsApp:', error);
        showToast('Failed to send on WhatsApp', 'error');
    }
}

function showModal(html) {
    document.getElementById('modal-container').innerHTML = html;
}

// Make functions available globally
window.viewBillDetails = viewBillDetails;
window.printBill = printBill;
window.sendBillOnWhatsApp = sendBillOnWhatsApp;

// ============ ANALYTICS PAGE ============
let revenueTrendChart = null;
let profitMarginChart = null;
let paymentMethodsChart = null;
let categorySalesChart = null;

function initializeAnalyticsPage() {
    const analyticsPeriod = document.getElementById('analytics-period');
    if (analyticsPeriod) {
        analyticsPeriod.addEventListener('change', loadAnalytics);
    }

    const refreshBtn = document.getElementById('refresh-analytics-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadAnalytics);
    }

    const revenueChartType = document.getElementById('revenue-chart-type');
    if (revenueChartType) {
        revenueChartType.addEventListener('change', loadAnalytics);
    }
}

async function loadAnalytics() {
    try {
        const period = document.getElementById('analytics-period')?.value || 'month';
        
        // Get data
        const billsResult = await window.electronAPI.bills.getAll();
        const productsResult = await window.electronAPI.products.getAll();
        const customersResult = await window.electronAPI.customers.getAll();
        
        if (!billsResult.success || !productsResult.success || !customersResult.success) {
            showToast('Failed to load analytics data', 'error');
            return;
        }
        
        const bills = billsResult.data;
        const products = productsResult.data;
        const customers = customersResult.data;
        
        // Filter bills by period
        const filteredBills = filterBillsByPeriod(bills, period);
        
        // Calculate metrics
        const analytics = calculateAnalytics(filteredBills, products, customers, bills);
        
        // Update UI
        updateMetrics(analytics);
        updateRevenueTrendChart(filteredBills, period);
        updateProfitMarginChart(analytics);
        updateTopProducts(filteredBills);
        updateTopCustomers(filteredBills, customers);
        updatePaymentMethodsChart(filteredBills);
        updateCategorySalesChart(filteredBills);
        updateAdditionalStats(analytics);
        
    } catch (error) {
        console.error('Error loading analytics:', error);
        showToast('Failed to load analytics', 'error');
    }
}

function filterBillsByPeriod(bills, period) {
    // Check for custom date range
    const customRange = getCustomDateRange('analytics');
    if (customRange) {
        const endDate = new Date(customRange.endDate);
        endDate.setHours(23, 59, 59, 999);
        return bills.filter(bill => {
            const billDate = new Date(bill.date);
            return billDate >= customRange.startDate && billDate <= endDate;
        });
    }
    
    const now = new Date();
    let startDate;
    
    switch(period) {
        case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
        case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        case 'all':
            return bills;
    }
    
    return bills.filter(bill => new Date(bill.date) >= startDate);
}

function calculateAnalytics(filteredBills, products, customers, allBills) {
    // Revenue and orders
    const revenue = filteredBills.reduce((sum, bill) => sum + bill.total, 0);
    const orders = filteredBills.length;
    const avgOrderValue = orders > 0 ? revenue / orders : 0;
    
    // Calculate profit from bill items
    let totalProfit = 0;
    let totalCost = 0;
    
    filteredBills.forEach(bill => {
        // Parse items if it's a string
        const items = typeof bill.items === 'string' ? JSON.parse(bill.items) : (bill.items || []);
        
        items.forEach(item => {
            const cost = (item.cost_price || 0) * item.quantity;
            const selling = item.price * item.quantity;
            totalProfit += (selling - cost);
            totalCost += cost;
        });
    });
    
    const profitMargin = revenue > 0 ? (totalProfit / revenue) * 100 : 0;
    
    // Calculate items sold
    const itemsSold = filteredBills.reduce((sum, bill) => {
        const items = typeof bill.items === 'string' ? JSON.parse(bill.items) : (bill.items || []);
        return sum + items.reduce((itemSum, item) => itemSum + item.quantity, 0);
    }, 0);
    
    // Active customers (customers who made purchases in period)
    const activeCustomers = new Set(filteredBills.map(bill => bill.customer_id)).size;
    
    // Calculate growth rate (compare with previous period)
    const growthRate = calculateGrowthRate(filteredBills, allBills);
    
    // Calculate percentage changes
    const previousPeriodBills = getPreviousPeriodBills(allBills);
    const prevRevenue = previousPeriodBills.reduce((sum, bill) => sum + bill.total, 0);
    const prevOrders = previousPeriodBills.length;
    
    let prevProfit = 0;
    previousPeriodBills.forEach(bill => {
        const items = typeof bill.items === 'string' ? JSON.parse(bill.items) : (bill.items || []);
        items.forEach(item => {
            const cost = (item.cost_price || 0) * item.quantity;
            const selling = item.price * item.quantity;
            prevProfit += (selling - cost);
        });
    });
    
    const prevAvg = prevOrders > 0 ? prevRevenue / prevOrders : 0;
    
    const revenueChange = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue * 100) : 0;
    const profitChange = prevProfit > 0 ? ((totalProfit - prevProfit) / prevProfit * 100) : 0;
    const ordersChange = prevOrders > 0 ? ((orders - prevOrders) / prevOrders * 100) : 0;
    const avgChange = prevAvg > 0 ? ((avgOrderValue - prevAvg) / prevAvg * 100) : 0;
    
    return {
        revenue,
        totalProfit,
        orders,
        avgOrderValue,
        profitMargin,
        itemsSold,
        activeCustomers,
        growthRate,
        revenueChange,
        profitChange,
        ordersChange,
        avgChange
    };
}

function getPreviousPeriodBills(allBills) {
    const period = document.getElementById('analytics-period')?.value || 'month';
    const now = new Date();
    let startDate, endDate;
    
    switch(period) {
        case 'today':
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
            break;
        case 'week':
            endDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case 'month':
            endDate = new Date(now.getFullYear(), now.getMonth(), 1);
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            break;
        case 'year':
            endDate = new Date(now.getFullYear(), 0, 1);
            startDate = new Date(now.getFullYear() - 1, 0, 1);
            break;
        default:
            return [];
    }
    
    return allBills.filter(bill => {
        const billDate = new Date(bill.date);
        return billDate >= startDate && billDate < endDate;
    });
}

function calculateGrowthRate(filteredBills, allBills) {
    const previousPeriodBills = getPreviousPeriodBills(allBills);
    const currentRevenue = filteredBills.reduce((sum, bill) => sum + bill.total, 0);
    const previousRevenue = previousPeriodBills.reduce((sum, bill) => sum + bill.total, 0);
    
    if (previousRevenue === 0) return 0;
    return ((currentRevenue - previousRevenue) / previousRevenue * 100);
}

function updateMetrics(analytics) {
    document.getElementById('metric-revenue').textContent = `₹${analytics.revenue.toFixed(2)}`;
    document.getElementById('metric-profit').textContent = `₹${analytics.totalProfit.toFixed(2)}`;
    document.getElementById('metric-orders').textContent = analytics.orders;
    document.getElementById('metric-avg').textContent = `₹${analytics.avgOrderValue.toFixed(2)}`;
    
    // Update change indicators
    updateChangeIndicator('revenue-change', analytics.revenueChange);
    updateChangeIndicator('profit-change', analytics.profitChange);
    updateChangeIndicator('orders-change', analytics.ordersChange);
    updateChangeIndicator('avg-change', analytics.avgChange);
}

function updateChangeIndicator(elementId, change) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const isPositive = change >= 0;
    element.className = 'metric-change ' + (isPositive ? 'positive' : 'negative');
    element.innerHTML = `<i class="fas fa-arrow-${isPositive ? 'up' : 'down'}"></i> ${Math.abs(change).toFixed(1)}%`;
}

function updateRevenueTrendChart(bills, period) {
    const ctx = document.getElementById('revenue-trend-chart');
    if (!ctx) return;
    
    if (revenueTrendChart) {
        revenueTrendChart.destroy();
    }
    
    const chartData = prepareRevenueTrendData(bills, period);
    
    revenueTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'Revenue',
                data: chartData.values,
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                tension: 0.4,
                fill: true,
                borderWidth: 3,
                pointRadius: 4,
                pointBackgroundColor: '#4CAF50',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Revenue: ₹' + context.parsed.y.toFixed(2);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₹' + value;
                        }
                    }
                }
            }
        }
    });
}

function prepareRevenueTrendData(bills, period) {
    const chartType = document.getElementById('revenue-chart-type')?.value || 'weekly';
    const now = new Date();
    const labels = [];
    const values = [];
    
    if (chartType === 'daily') {
        // Last 7 days
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().split('T')[0];
            labels.push(date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }));
            
            const dayRevenue = bills
                .filter(bill => bill.date.split('T')[0] === dateStr)
                .reduce((sum, bill) => sum + bill.total, 0);
            values.push(dayRevenue);
        }
    } else if (chartType === 'weekly') {
        // Last 4 weeks
        for (let i = 3; i >= 0; i--) {
            const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
            const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
            labels.push(`Week ${4 - i}`);
            
            const weekRevenue = bills
                .filter(bill => {
                    const billDate = new Date(bill.date);
                    return billDate >= weekStart && billDate < weekEnd;
                })
                .reduce((sum, bill) => sum + bill.total, 0);
            values.push(weekRevenue);
        }
    } else {
        // Last 6 months
        for (let i = 5; i >= 0; i--) {
            const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
            labels.push(month.toLocaleDateString('en-IN', { month: 'short' }));
            
            const monthRevenue = bills
                .filter(bill => {
                    const billDate = new Date(bill.date);
                    return billDate.getMonth() === month.getMonth() && 
                           billDate.getFullYear() === month.getFullYear();
                })
                .reduce((sum, bill) => sum + bill.total, 0);
            values.push(monthRevenue);
        }
    }
    
    return { labels, values };
}

function updateProfitMarginChart(analytics) {
    const ctx = document.getElementById('profit-margin-chart');
    if (!ctx) return;
    
    if (profitMarginChart) {
        profitMarginChart.destroy();
    }
    
    const profitPercent = analytics.profitMargin;
    const costPercent = 100 - profitPercent;
    
    profitMarginChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Profit', 'Cost'],
            datasets: [{
                data: [profitPercent, costPercent],
                backgroundColor: ['#4CAF50', '#FF9800'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.parsed.toFixed(1) + '%';
                        }
                    }
                }
            }
        }
    });
}

function updateTopProducts(bills) {
    const productSales = {};
    
    bills.forEach(bill => {
        const items = typeof bill.items === 'string' ? JSON.parse(bill.items) : (bill.items || []);
        items.forEach(item => {
            if (!productSales[item.product_id]) {
                productSales[item.product_id] = {
                    name: item.product_name,
                    quantity: 0,
                    revenue: 0
                };
            }
            productSales[item.product_id].quantity += item.quantity;
            productSales[item.product_id].revenue += item.total;
        });
    });
    
    const topProducts = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
    
    const container = document.getElementById('top-products-analytics');
    if (!container) return;
    
    if (topProducts.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">No data available</p>';
        return;
    }
    
    container.innerHTML = topProducts.map((product, index) => `
        <div class="top-item">
            <div class="top-item-rank">${index + 1}</div>
            <div class="top-item-details">
                <h4>${product.name}</h4>
                <p>${product.quantity} units sold</p>
            </div>
            <div class="top-item-value">₹${product.revenue.toFixed(2)}</div>
        </div>
    `).join('');
}

function updateTopCustomers(bills, customers) {
    const customerSales = {};
    
    bills.forEach(bill => {
        if (!customerSales[bill.customer_id]) {
            customerSales[bill.customer_id] = {
                name: bill.customer_name,
                orders: 0,
                revenue: 0
            };
        }
        customerSales[bill.customer_id].orders += 1;
        customerSales[bill.customer_id].revenue += bill.total;
    });
    
    const topCustomers = Object.values(customerSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
    
    const container = document.getElementById('top-customers-analytics');
    if (!container) return;
    
    if (topCustomers.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">No data available</p>';
        return;
    }
    
    container.innerHTML = topCustomers.map((customer, index) => `
        <div class="top-item">
            <div class="top-item-rank">${index + 1}</div>
            <div class="top-item-details">
                <h4>${customer.name}</h4>
                <p>${customer.orders} orders</p>
            </div>
            <div class="top-item-value">₹${customer.revenue.toFixed(2)}</div>
        </div>
    `).join('');
}

function updatePaymentMethodsChart(bills) {
    const ctx = document.getElementById('payment-methods-chart');
    if (!ctx) return;
    
    if (paymentMethodsChart) {
        paymentMethodsChart.destroy();
    }
    
    const paymentCounts = {};
    bills.forEach(bill => {
        const method = bill.payment_mode.toUpperCase();
        paymentCounts[method] = (paymentCounts[method] || 0) + 1;
    });
    
    const labels = Object.keys(paymentCounts);
    const values = Object.values(paymentCounts);
    const colors = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0'];
    
    paymentMethodsChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function updateCategorySalesChart(bills) {
    const ctx = document.getElementById('category-sales-chart');
    if (!ctx) return;
    
    if (categorySalesChart) {
        categorySalesChart.destroy();
    }
    
    const categorySales = {};
    
    bills.forEach(bill => {
        const items = typeof bill.items === 'string' ? JSON.parse(bill.items) : (bill.items || []);
        items.forEach(item => {
            // Get category from products
            const category = 'General'; // Default category
            categorySales[category] = (categorySales[category] || 0) + item.total;
        });
    });
    
    const labels = Object.keys(categorySales);
    const values = Object.values(categorySales);
    
    categorySalesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Sales',
                data: values,
                backgroundColor: '#2196F3',
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₹' + value;
                        }
                    }
                }
            }
        }
    });
}

function updateAdditionalStats(analytics) {
    document.getElementById('profit-margin-percent').textContent = analytics.profitMargin.toFixed(1) + '%';
    document.getElementById('items-sold').textContent = analytics.itemsSold;
    document.getElementById('active-customers').textContent = analytics.activeCustomers;
    document.getElementById('growth-rate').textContent = analytics.growthRate.toFixed(1) + '%';
}

// ============ REPORTS PAGE ============
let salesTrendChart = null;
let salesDistributionChart = null;
let profitProductChart = null;
let costRevenueChart = null;
let stockStatusChart = null;
let stockValueChart = null;
let topCustomersChart = null;
let customerActivityChart = null;
let paymentDistributionChart = null;
let paymentVolumeChart = null;

function initializeReportsPage() {
    const reportPeriod = document.getElementById('report-period');
    if (reportPeriod) {
        reportPeriod.addEventListener('change', handleReportPeriodChange);
    }
    
    const exportBtn = document.getElementById('export-report-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportReport);
    }
    
    const printBtn = document.getElementById('print-report-btn');
    if (printBtn) {
        printBtn.addEventListener('click', printReport);
    }
    
    // Report tabs
    document.querySelectorAll('.report-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.report-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            document.querySelectorAll('.report-section').forEach(s => s.classList.remove('active'));
            const reportId = this.dataset.report + '-report';
            const reportSection = document.getElementById(reportId);
            if (reportSection) {
                reportSection.classList.add('active');
            }
            
            loadReports();
        });
    });
    
    // Custom date range
    const applyCustomRange = document.getElementById('apply-custom-range');
    if (applyCustomRange) {
        applyCustomRange.addEventListener('click', loadReports);
    }
}

function handleReportPeriodChange() {
    const periodSelect = document.getElementById('report-period');
    const customDateRange = document.getElementById('custom-date-range');
    
    if (!periodSelect || !customDateRange) return;
    
    const period = periodSelect.value;
    
    if (period === 'custom') {
        customDateRange.style.display = 'block';
        // Set default dates
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        
        const endDateInput = document.getElementById('report-end-date');
        const startDateInput = document.getElementById('report-start-date');
        
        if (endDateInput) endDateInput.valueAsDate = endDate;
        if (startDateInput) startDateInput.valueAsDate = startDate;
    } else {
        customDateRange.style.display = 'none';
        loadReports();
    }
}

async function loadReports() {
    const periodSelect = document.getElementById('report-period');
    const activeTabElement = document.querySelector('.report-tab.active');
    
    if (!periodSelect || !activeTabElement) {
        console.warn('Required elements not found for loading reports');
        return;
    }
    
    const period = periodSelect.value;
    const activeTab = activeTabElement.dataset.report;
    
    try {
        const billsResult = await window.electronAPI.bills.getAll();
        const productsResult = await window.electronAPI.products.getAll();
        const customersResult = await window.electronAPI.customers.getAll();
        
        if (!billsResult.success || !productsResult.success || !customersResult.success) {
            showToast('Failed to load report data', 'error');
            return;
        }
        
        const bills = billsResult.data;
        const products = productsResult.data;
        const customers = customersResult.data;
        
        // Filter bills by period
        const filteredBills = filterReportBills(bills, period);
        
        // Load active report
        switch(activeTab) {
            case 'sales':
                loadSalesReport(filteredBills, bills);
                break;
            case 'profit':
                loadProfitReport(filteredBills, bills);
                break;
            case 'inventory':
                loadInventoryReport(products, filteredBills);
                break;
            case 'customer':
                loadCustomerReport(customers, filteredBills, bills);
                break;
            case 'payment':
                loadPaymentReport(filteredBills, bills);
                break;
        }
    } catch (error) {
        console.error('Error loading reports:', error);
        showToast('Failed to load reports', 'error');
    }
}

function filterReportBills(bills, period) {
    if (period === 'custom') {
        const startDateInput = document.getElementById('report-start-date');
        const endDateInput = document.getElementById('report-end-date');
        
        if (!startDateInput || !endDateInput || !startDateInput.value || !endDateInput.value) {
            return bills;
        }
        
        const startDate = new Date(startDateInput.value);
        const endDate = new Date(endDateInput.value);
        endDate.setHours(23, 59, 59, 999);
        
        return bills.filter(bill => {
            const billDate = new Date(bill.date);
            return billDate >= startDate && billDate <= endDate;
        });
    }
    
    const now = new Date();
    let startDate;
    
    switch(period) {
        case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
        case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        default:
            return bills;
    }
    
    return bills.filter(bill => new Date(bill.date) >= startDate);
}

function loadSalesReport(filteredBills, allBills) {
    // Calculate metrics
    const totalSales = filteredBills.reduce((sum, bill) => sum + bill.total, 0);
    const totalOrders = filteredBills.length;
    const avgOrder = totalOrders > 0 ? totalSales / totalOrders : 0;
    const totalItems = filteredBills.reduce((sum, bill) => {
        const items = typeof bill.items === 'string' ? JSON.parse(bill.items) : (bill.items || []);
        return sum + items.reduce((itemSum, item) => itemSum + item.quantity, 0);
    }, 0);
    
    // Previous period comparison
    const prevBills = getPreviousPeriodBills(allBills);
    const prevSales = prevBills.reduce((sum, bill) => sum + bill.total, 0);
    const prevOrders = prevBills.length;
    const prevAvg = prevOrders > 0 ? prevSales / prevOrders : 0;
    const prevItems = prevBills.reduce((sum, bill) => {
        const items = typeof bill.items === 'string' ? JSON.parse(bill.items) : (bill.items || []);
        return sum + items.reduce((itemSum, item) => itemSum + item.quantity, 0);
    }, 0);
    
    // Update summary cards
    document.getElementById('report-total-sales').textContent = `₹${totalSales.toFixed(2)}`;
    document.getElementById('report-total-orders').textContent = totalOrders;
    document.getElementById('report-avg-order').textContent = `₹${avgOrder.toFixed(2)}`;
    document.getElementById('report-total-items').textContent = totalItems;
    
    updateReportChange('report-sales-change', totalSales, prevSales);
    updateReportChange('report-orders-change', totalOrders, prevOrders);
    updateReportChange('report-avg-change', avgOrder, prevAvg);
    updateReportChange('report-items-change', totalItems, prevItems);
    
    // Sales breakdown by date
    const breakdownData = {};
    filteredBills.forEach(bill => {
        const date = new Date(bill.date).toISOString().split('T')[0];
        if (!breakdownData[date]) {
            breakdownData[date] = { bills: 0, items: 0, revenue: 0 };
        }
        breakdownData[date].bills += 1;
        breakdownData[date].revenue += bill.total;
        const items = typeof bill.items === 'string' ? JSON.parse(bill.items) : (bill.items || []);
        breakdownData[date].items += items.reduce((sum, item) => sum + item.quantity, 0);
    });
    
    const tbody = document.getElementById('sales-breakdown-body');
    if (tbody) {
        tbody.innerHTML = Object.entries(breakdownData)
            .sort((a, b) => b[0].localeCompare(a[0]))
            .map(([date, data]) => `
                <tr>
                    <td>${new Date(date).toLocaleDateString('en-IN')}</td>
                    <td>${data.bills}</td>
                    <td>${data.items}</td>
                    <td>₹${data.revenue.toFixed(2)}</td>
                    <td>₹${(data.revenue / data.bills).toFixed(2)}</td>
                </tr>
            `).join('');
    }
    
    const totalBillsEl = document.getElementById('sales-total-bills');
    const totalItemsEl = document.getElementById('sales-total-items');
    const totalRevenueEl = document.getElementById('sales-total-revenue');
    const avgOrderEl = document.getElementById('sales-avg-order');
    
    if (totalBillsEl) totalBillsEl.textContent = totalOrders;
    if (totalItemsEl) totalItemsEl.textContent = totalItems;
    if (totalRevenueEl) totalRevenueEl.textContent = `₹${totalSales.toFixed(2)}`;
    if (avgOrderEl) avgOrderEl.textContent = `₹${avgOrder.toFixed(2)}`;
    
    // Top products
    const productSales = {};
    filteredBills.forEach(bill => {
        const items = typeof bill.items === 'string' ? JSON.parse(bill.items) : (bill.items || []);
        items.forEach(item => {
            if (!productSales[item.product_id]) {
                productSales[item.product_id] = {
                    name: item.product_name,
                    quantity: 0,
                    revenue: 0
                };
            }
            productSales[item.product_id].quantity += item.quantity;
            productSales[item.product_id].revenue += item.total;
        });
    });
    
    const topProducts = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);
    
    const topProductsBody = document.getElementById('top-products-report-body');
    if (topProductsBody) {
        topProductsBody.innerHTML = topProducts.map((product, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${product.name}</td>
                <td>${product.quantity}</td>
                <td>₹${product.revenue.toFixed(2)}</td>
                <td>${totalSales > 0 ? ((product.revenue / totalSales) * 100).toFixed(1) : 0}%</td>
            </tr>
        `).join('');
    }    
    // Create Sales Charts
    createSalesTrendChart(breakdownData);
    createSalesDistributionChart(topProducts.slice(0, 5), totalSales);
}

function createSalesTrendChart(breakdownData) {
    const ctx = document.getElementById('sales-trend-chart');
    if (!ctx) return;
    
    if (salesTrendChart) {
        salesTrendChart.destroy();
    }
    
    const sortedData = Object.entries(breakdownData).sort((a, b) => a[0].localeCompare(b[0]));
    const labels = sortedData.map(([date]) => new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }));
    const values = sortedData.map(([, data]) => data.revenue);
    
    salesTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Revenue',
                data: values,
                borderColor: '#2196F3',
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                tension: 0.4,
                fill: true,
                borderWidth: 3,
                pointRadius: 5,
                pointBackgroundColor: '#2196F3',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Revenue: ₹' + context.parsed.y.toFixed(2);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₹' + value;
                        }
                    }
                }
            }
        }
    });
}

function createSalesDistributionChart(topProducts, totalSales) {
    const ctx = document.getElementById('sales-distribution-chart');
    if (!ctx) return;
    
    if (salesDistributionChart) {
        salesDistributionChart.destroy();
    }
    
    const labels = topProducts.map(p => p.name);
    const values = topProducts.map(p => p.revenue);
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'];
    
    salesDistributionChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const percentage = ((value / totalSales) * 100).toFixed(1);
                            return label + ': ₹' + value.toFixed(2) + ' (' + percentage + '%)';
                        }
                    }
                }
            }
        }
    });
}

function loadProfitReport(filteredBills, allBills) {
    let totalProfit = 0;
    let totalCost = 0;
    let totalRevenue = 0;
    
    const productProfit = {};
    
    filteredBills.forEach(bill => {
        totalRevenue += bill.total;
        const items = typeof bill.items === 'string' ? JSON.parse(bill.items) : (bill.items || []);
        items.forEach(item => {
            const cost = (item.cost_price || 0) * item.quantity;
            const revenue = item.price * item.quantity;
            const profit = revenue - cost;
            
            totalCost += cost;
            totalProfit += profit;
            
            if (!productProfit[item.product_id]) {
                productProfit[item.product_id] = {
                    name: item.product_name,
                    quantity: 0,
                    cost: 0,
                    revenue: 0,
                    profit: 0
                };
            }
            productProfit[item.product_id].quantity += item.quantity;
            productProfit[item.product_id].cost += cost;
            productProfit[item.product_id].revenue += revenue;
            productProfit[item.product_id].profit += profit;
        });
    });
    
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue * 100) : 0;
    
    // Previous period
    const prevBills = getPreviousPeriodBills(allBills);
    let prevProfit = 0;
    let prevRevenue = 0;
    prevBills.forEach(bill => {
        prevRevenue += bill.total;
        const items = typeof bill.items === 'string' ? JSON.parse(bill.items) : (bill.items || []);
        items.forEach(item => {
            const cost = (item.cost_price || 0) * item.quantity;
            const revenue = item.price * item.quantity;
            prevProfit += (revenue - cost);
        });
    });
    const prevMargin = prevRevenue > 0 ? (prevProfit / prevRevenue * 100) : 0;
    
    document.getElementById('report-total-profit').textContent = `₹${totalProfit.toFixed(2)}`;
    document.getElementById('report-profit-margin').textContent = `${profitMargin.toFixed(1)}%`;
    document.getElementById('report-total-cost').textContent = `₹${totalCost.toFixed(2)}`;
    document.getElementById('report-profit-revenue').textContent = `₹${totalRevenue.toFixed(2)}`;
    
    updateReportChange('report-profit-change', totalProfit, prevProfit);
    updateReportChange('report-margin-change', profitMargin, prevMargin);
    
    // Profit by product table
    const tbody = document.getElementById('profit-by-product-body');
    const productProfitArray = Object.values(productProfit).sort((a, b) => b.profit - a.profit);
    tbody.innerHTML = productProfitArray
        .map(product => {
            const margin = product.revenue > 0 ? (product.profit / product.revenue * 100) : 0;
            return `
                <tr>
                    <td>${product.name}</td>
                    <td>${product.quantity}</td>
                    <td>₹${product.cost.toFixed(2)}</td>
                    <td>₹${product.revenue.toFixed(2)}</td>
                    <td style="color: ${product.profit >= 0 ? '#4CAF50' : '#F44336'}">₹${product.profit.toFixed(2)}</td>
                    <td>${margin.toFixed(1)}%</td>
                </tr>
            `;
        }).join('');
    
    // Create Profit Charts
    createProfitProductChart(productProfitArray.slice(0, 10));
    createCostRevenueChart(totalCost, totalProfit);
}

function createProfitProductChart(products) {
    const ctx = document.getElementById('profit-product-chart');
    if (!ctx) return;
    
    if (profitProductChart) {
        profitProductChart.destroy();
    }
    
    const labels = products.map(p => p.name);
    const profits = products.map(p => p.profit);
    
    profitProductChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Profit',
                data: profits,
                backgroundColor: profits.map(p => p >= 0 ? '#4CAF50' : '#F44336'),
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Profit: ₹' + context.parsed.y.toFixed(2);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₹' + value;
                        }
                    }
                }
            }
        }
    });
}

function createCostRevenueChart(totalCost, totalProfit) {
    const ctx = document.getElementById('cost-revenue-chart');
    if (!ctx) return;
    
    if (costRevenueChart) {
        costRevenueChart.destroy();
    }
    
    costRevenueChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Cost', 'Profit'],
            datasets: [{
                data: [totalCost, totalProfit],
                backgroundColor: ['#FF9800', '#4CAF50'],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ₹' + context.parsed.toFixed(2);
                        }
                    }
                }
            }
        }
    });
}

async function loadInventoryReport(products, filteredBills) {
    const totalProducts = products.length;
    const lowStock = products.filter(p => p.stock > 0 && p.stock <= 10).length;
    const outOfStock = products.filter(p => p.stock === 0).length;
    const stockValue = products.reduce((sum, p) => sum + (p.cost_price * p.stock), 0);
    
    document.getElementById('report-total-products').textContent = totalProducts;
    document.getElementById('report-low-stock').textContent = lowStock;
    document.getElementById('report-out-stock').textContent = outOfStock;
    document.getElementById('report-stock-value').textContent = `₹${stockValue.toFixed(2)}`;
    
    const tbody = document.getElementById('inventory-status-body');
    tbody.innerHTML = products.map(product => {
        let status, statusClass;
        if (product.stock === 0) {
            status = 'Out of Stock';
            statusClass = 'status-danger';
        } else if (product.stock <= 10) {
            status = 'Low Stock';
            statusClass = 'status-warning';
        } else {
            status = 'In Stock';
            statusClass = 'status-success';
        }
        
        return `
            <tr>
                <td>${product.name}</td>
                <td>${product.category || 'Others'}</td>
                <td>${product.stock}</td>
                <td>₹${(product.cost_price || 0).toFixed(2)}</td>
                <td>₹${product.price.toFixed(2)}</td>
                <td>₹${((product.cost_price || 0) * product.stock).toFixed(2)}</td>
                <td><span class="status-badge ${statusClass}">${status}</span></td>
            </tr>
        `;
    }).join('');
    
    // Create Inventory Charts
    createStockStatusChart(totalProducts - outOfStock - lowStock, lowStock, outOfStock);
    createStockValueChart(products);
}

function createStockStatusChart(inStock, lowStock, outOfStock) {
    const ctx = document.getElementById('stock-status-chart');
    if (!ctx) return;
    
    if (stockStatusChart) {
        stockStatusChart.destroy();
    }
    
    stockStatusChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['In Stock', 'Low Stock', 'Out of Stock'],
            datasets: [{
                data: [inStock, lowStock, outOfStock],
                backgroundColor: ['#4CAF50', '#FF9800', '#F44336'],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function createStockValueChart(products) {
    const ctx = document.getElementById('stock-value-chart');
    if (!ctx) return;
    
    if (stockValueChart) {
        stockValueChart.destroy();
    }
    
    // Group by category
    const categoryData = {};
    products.forEach(product => {
        const category = product.category || 'Others';
        if (!categoryData[category]) {
            categoryData[category] = 0;
        }
        categoryData[category] += (product.cost_price || 0) * product.stock;
    });
    
    const labels = Object.keys(categoryData);
    const values = Object.values(categoryData);
    
    stockValueChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Stock Value',
                data: values,
                backgroundColor: '#2196F3',
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Value: ₹' + context.parsed.y.toFixed(2);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₹' + value;
                        }
                    }
                }
            }
        }
    });
}

function loadCustomerReport(customers, filteredBills, allBills) {
    const activeCustomers = new Set(filteredBills.map(b => b.customer_id)).size;
    
    // Calculate new customers in period
    const period = document.getElementById('report-period').value;
    let periodStart;
    const now = new Date();
    
    switch(period) {
        case 'today':
            periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
        case 'week':
            periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case 'month':
            periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case 'year':
            periodStart = new Date(now.getFullYear(), 0, 1);
            break;
        case 'custom':
            periodStart = new Date(document.getElementById('report-start-date').value);
            break;
        default:
            periodStart = new Date(0);
    }
    
    const newCustomers = customers.filter(c => new Date(c.created_at) >= periodStart).length;
    
    const customerData = {};
    filteredBills.forEach(bill => {
        if (!customerData[bill.customer_id]) {
            customerData[bill.customer_id] = {
                name: bill.customer_name,
                phone: bill.customer_phone,
                orders: 0,
                totalSpent: 0,
                loyaltyPoints: 0
            };
        }
        customerData[bill.customer_id].orders += 1;
        customerData[bill.customer_id].totalSpent += bill.total;
    });
    
    // Add loyalty points from customers array
    customers.forEach(customer => {
        if (customerData[customer.id]) {
            customerData[customer.id].loyaltyPoints = customer.loyalty_points || 0;
        }
    });
    
    const totalSpent = Object.values(customerData).reduce((sum, c) => sum + c.totalSpent, 0);
    const avgSpending = activeCustomers > 0 ? totalSpent / activeCustomers : 0;
    
    document.getElementById('report-total-customers').textContent = customers.length;
    document.getElementById('report-active-customers').textContent = activeCustomers;
    document.getElementById('report-new-customers').textContent = newCustomers;
    document.getElementById('report-avg-spending').textContent = `₹${avgSpending.toFixed(2)}`;
    
    const tbody = document.getElementById('customer-summary-body');
    const customerArray = Object.values(customerData).sort((a, b) => b.totalSpent - a.totalSpent);
    tbody.innerHTML = customerArray
        .map(customer => `
            <tr>
                <td>${customer.name}</td>
                <td>${customer.phone}</td>
                <td>${customer.orders}</td>
                <td>₹${customer.totalSpent.toFixed(2)}</td>
                <td>₹${(customer.totalSpent / customer.orders).toFixed(2)}</td>
                <td>${customer.loyaltyPoints}</td>
            </tr>
        `).join('');
    
    // Create Customer Charts
    createTopCustomersChart(customerArray.slice(0, 10));
    createCustomerActivityChart(activeCustomers, customers.length - activeCustomers);
}

function createTopCustomersChart(customers) {
    const ctx = document.getElementById('top-customers-chart');
    if (!ctx) return;
    
    if (topCustomersChart) {
        topCustomersChart.destroy();
    }
    
    const labels = customers.map(c => c.name);
    const values = customers.map(c => c.totalSpent);
    
    topCustomersChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Spent',
                data: values,
                backgroundColor: '#9C27B0',
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Spent: ₹' + context.parsed.x.toFixed(2);
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₹' + value;
                        }
                    }
                }
            }
        }
    });
}

function createCustomerActivityChart(active, inactive) {
    const ctx = document.getElementById('customer-activity-chart');
    if (!ctx) return;
    
    if (customerActivityChart) {
        customerActivityChart.destroy();
    }
    
    customerActivityChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Active', 'Inactive'],
            datasets: [{
                data: [active, inactive],
                backgroundColor: ['#4CAF50', '#9E9E9E'],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function loadPaymentReport(filteredBills, allBills) {
    const paymentData = {
        cash: { count: 0, total: 0 },
        upi: { count: 0, total: 0 },
        card: { count: 0, total: 0 },
        cheque: { count: 0, total: 0 }
    };
    
    filteredBills.forEach(bill => {
        const method = bill.payment_mode.toLowerCase();
        if (paymentData[method]) {
            paymentData[method].count += 1;
            paymentData[method].total += bill.total;
        }
    });
    
    const grandTotal = Object.values(paymentData).reduce((sum, p) => sum + p.total, 0);
    
    document.getElementById('report-cash-total').textContent = `₹${paymentData.cash.total.toFixed(2)}`;
    document.getElementById('report-cash-count').textContent = `${paymentData.cash.count} transactions`;
    document.getElementById('report-upi-total').textContent = `₹${paymentData.upi.total.toFixed(2)}`;
    document.getElementById('report-upi-count').textContent = `${paymentData.upi.count} transactions`;
    document.getElementById('report-card-total').textContent = `₹${paymentData.card.total.toFixed(2)}`;
    document.getElementById('report-card-count').textContent = `${paymentData.card.count} transactions`;
    document.getElementById('report-cheque-total').textContent = `₹${paymentData.cheque.total.toFixed(2)}`;
    document.getElementById('report-cheque-count').textContent = `${paymentData.cheque.count} transactions`;
    
    const tbody = document.getElementById('payment-breakdown-body');
    const paymentArray = Object.entries(paymentData)
        .filter(([_, data]) => data.count > 0)
        .sort((a, b) => b[1].total - a[1].total);
    
    tbody.innerHTML = paymentArray
        .map(([method, data]) => {
            const percentage = grandTotal > 0 ? (data.total / grandTotal * 100) : 0;
            const avgTransaction = data.count > 0 ? data.total / data.count : 0;
            return `
                <tr>
                    <td style="text-transform: uppercase;">${method}</td>
                    <td>${data.count}</td>
                    <td>₹${data.total.toFixed(2)}</td>
                    <td>${percentage.toFixed(1)}%</td>
                    <td>₹${avgTransaction.toFixed(2)}</td>
                </tr>
            `;
        }).join('');
    
    // Create Payment Charts
    createPaymentDistributionChart(paymentData, grandTotal);
    createPaymentVolumeChart(paymentData);
}

function createPaymentDistributionChart(paymentData, grandTotal) {
    const ctx = document.getElementById('payment-distribution-chart');
    if (!ctx) return;
    
    if (paymentDistributionChart) {
        paymentDistributionChart.destroy();
    }
    
    const labels = [];
    const values = [];
    const colors = {
        cash: '#4CAF50',
        upi: '#2196F3',
        card: '#FF9800',
        cheque: '#9C27B0'
    };
    const bgColors = [];
    
    Object.entries(paymentData).forEach(([method, data]) => {
        if (data.count > 0) {
            labels.push(method.toUpperCase());
            values.push(data.total);
            bgColors.push(colors[method] || '#666');
        }
    });
    
    paymentDistributionChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: bgColors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed;
                            const percentage = ((value / grandTotal) * 100).toFixed(1);
                            return context.label + ': ₹' + value.toFixed(2) + ' (' + percentage + '%)';
                        }
                    }
                }
            }
        }
    });
}

function createPaymentVolumeChart(paymentData) {
    const ctx = document.getElementById('payment-volume-chart');
    if (!ctx) return;
    
    if (paymentVolumeChart) {
        paymentVolumeChart.destroy();
    }
    
    const labels = [];
    const values = [];
    const colors = {
        cash: '#4CAF50',
        upi: '#2196F3',
        card: '#FF9800',
        cheque: '#9C27B0'
    };
    const bgColors = [];
    
    Object.entries(paymentData).forEach(([method, data]) => {
        if (data.count > 0) {
            labels.push(method.toUpperCase());
            values.push(data.count);
            bgColors.push(colors[method] || '#666');
        }
    });
    
    paymentVolumeChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Transactions',
                data: values,
                backgroundColor: bgColors,
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function updateReportChange(elementId, current, previous) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    if (previous === 0) {
        element.textContent = '+0%';
        element.className = 'summary-change positive';
        return;
    }
    
    const change = ((current - previous) / previous * 100);
    const isPositive = change >= 0;
    element.className = 'summary-change ' + (isPositive ? 'positive' : 'negative');
    element.textContent = `${isPositive ? '+' : ''}${change.toFixed(1)}%`;
}

async function exportReport() {
    const activeTab = document.querySelector('.report-tab.active').dataset.report;
    const period = document.getElementById('report-period').value;
    
    showToast('Exporting report...', 'info');
    
    try {
        const reportData = {
            type: activeTab,
            period: period,
            date: new Date().toISOString()
        };
        
        await window.electronAPI.export('report', reportData);
        showToast('Report exported successfully', 'success');
    } catch (error) {
        showToast('Failed to export report', 'error');
    }
}

function printReport() {
    window.print();
    showToast('Printing report...', 'info');
}

async function loadReports() {
    const period = document.getElementById('report-period').value;
    const result = await window.electronAPI.reports.getSales({ period });
    
    if (result.success) {
        renderReport(result.data);
    }
}

function renderReport(data) {
    const content = document.getElementById('reports-content');
    content.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon" style="background: #4CAF50;">
                    <i class="fas fa-dollar-sign"></i>
                </div>
                <div class="stat-info">
                    <h3>₹${data.totalSales || 0}</h3>
                    <p>Total Sales</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="background: #2196F3;">
                    <i class="fas fa-file-invoice"></i>
                </div>
                <div class="stat-info">
                    <h3>${data.totalBills || 0}</h3>
                    <p>Total Bills</p>
                </div>
            </div>
        </div>
    `;
}

// ============ SETTINGS ============
function initializeSettings() {
    // Load saved settings
    loadBusinessSettings();

    // Enable/Disable all taxes master toggle
    const enableAllTaxesCheckbox = document.getElementById('enable-all-taxes');
    const taxSettingsGroup = document.getElementById('tax-settings-group');
    
    if (enableAllTaxesCheckbox && taxSettingsGroup) {
        const updateAllTaxesState = () => {
            const isEnabled = enableAllTaxesCheckbox.checked;
            taxSettingsGroup.style.opacity = isEnabled ? '1' : '0.5';
            taxSettingsGroup.style.pointerEvents = isEnabled ? 'auto' : 'none';
        };
        
        enableAllTaxesCheckbox.addEventListener('change', updateAllTaxesState);
        updateAllTaxesState(); // Initial state
    }

    // Enable/Disable tax percentage input based on checkbox
    const enableTaxCheckbox = document.getElementById('enable-default-tax');
    const taxPercentageInput = document.getElementById('default-tax-percentage');
    const taxPercentageGroup = document.getElementById('tax-percentage-group');
    
    if (enableTaxCheckbox && taxPercentageInput && taxPercentageGroup) {
        const updateTaxInputState = () => {
            const isEnabled = enableTaxCheckbox.checked;
            taxPercentageInput.disabled = !isEnabled;
            taxPercentageGroup.style.opacity = isEnabled ? '1' : '0.5';
            if (!isEnabled) {
                taxPercentageInput.value = '0';
            }
        };
        
        enableTaxCheckbox.addEventListener('change', updateTaxInputState);
        updateTaxInputState(); // Initial state
    }

    // Business info form
    const businessInfoForm = document.getElementById('business-info-form');
    if (businessInfoForm) {
        businessInfoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveBusinessSettings();
        });
    }

    document.getElementById('backup-db-btn').addEventListener('click', async () => {
        const result = await window.electronAPI.backup();
        if (result.success) {
            showToast('Database backed up successfully', 'success');
        } else {
            showToast(result.error || 'Backup failed', 'error');
        }
    });

    document.getElementById('export-data-btn').addEventListener('click', async () => {
        const result = await window.electronAPI.backup();
        if (result.success) {
            showToast('Data exported successfully', 'success');
        } else {
            showToast(result.error || 'Export failed', 'error');
        }
    });

    
    // Factory Reset Button
    const factoryResetBtn = document.getElementById('factory-reset-btn');
    if (factoryResetBtn) {
        factoryResetBtn.addEventListener('click', () => {
            showFactoryResetConfirmation();
        });
    }
}

function loadBusinessSettings() {
    const settings = JSON.parse(localStorage.getItem('businessSettings') || '{}');
    
    const businessName = document.getElementById('business-name');
    const businessAddress = document.getElementById('business-address');
    const businessPhone = document.getElementById('business-phone');
    const businessGst = document.getElementById('business-gst');
    const enableAllTaxesCheckbox = document.getElementById('enable-all-taxes');
    const enableTaxCheckbox = document.getElementById('enable-default-tax');
    const defaultTaxPercentage = document.getElementById('default-tax-percentage');

    if (businessName && settings.businessName) businessName.value = settings.businessName;
    if (businessAddress && settings.businessAddress) businessAddress.value = settings.businessAddress;
    if (businessPhone && settings.businessPhone) businessPhone.value = settings.businessPhone;
    if (businessGst && settings.businessGst) businessGst.value = settings.businessGst;
    if (enableAllTaxesCheckbox) enableAllTaxesCheckbox.checked = settings.enableAllTaxes !== undefined ? settings.enableAllTaxes : true;
    if (enableTaxCheckbox) enableTaxCheckbox.checked = settings.enableDefaultTax || false;
    if (defaultTaxPercentage && settings.defaultTaxPercentage !== undefined) {
        defaultTaxPercentage.value = settings.defaultTaxPercentage;
    }
    
    // Update UI state for all taxes
    if (enableAllTaxesCheckbox) {
        const taxSettingsGroup = document.getElementById('tax-settings-group');
        if (taxSettingsGroup) {
            const isEnabled = enableAllTaxesCheckbox.checked;
            taxSettingsGroup.style.opacity = isEnabled ? '1' : '0.5';
            taxSettingsGroup.style.pointerEvents = isEnabled ? 'auto' : 'none';
        }
    }
    
    // Update UI state for default tax
    if (enableTaxCheckbox) {
        const taxPercentageInput = document.getElementById('default-tax-percentage');
        const taxPercentageGroup = document.getElementById('tax-percentage-group');
        if (taxPercentageInput && taxPercentageGroup) {
            const isEnabled = enableTaxCheckbox.checked;
            taxPercentageInput.disabled = !isEnabled;
            taxPercentageGroup.style.opacity = isEnabled ? '1' : '0.5';
        }
    }
}

function saveBusinessSettings() {
    const enableAllTaxesCheckbox = document.getElementById('enable-all-taxes');
    const enableTaxCheckbox = document.getElementById('enable-default-tax');
    const isAllTaxesEnabled = enableAllTaxesCheckbox ? enableAllTaxesCheckbox.checked : true;
    const isDefaultTaxEnabled = enableTaxCheckbox ? enableTaxCheckbox.checked : false;
    
    const settings = {
        businessName: document.getElementById('business-name').value,
        businessAddress: document.getElementById('business-address').value,
        businessPhone: document.getElementById('business-phone').value,
        businessGst: document.getElementById('business-gst').value,
        enableAllTaxes: isAllTaxesEnabled,
        enableDefaultTax: isDefaultTaxEnabled,
        defaultTaxPercentage: isDefaultTaxEnabled ? (parseFloat(document.getElementById('default-tax-percentage').value) || 0) : 0
    };

    localStorage.setItem('businessSettings', JSON.stringify(settings));
    showToast('Settings saved successfully', 'success');
    
    // Update billing page if active
    if (document.getElementById('billing-page').classList.contains('active')) {
        updateBillSummary();
    }
}

function showFactoryResetConfirmation() {
    const modal = `
        <div class="modal-overlay">
            <div class="modal modal-danger" onclick="event.stopPropagation()">
                <div class="modal-header modal-header-danger">
                    <h2><i class="fas fa-exclamation-triangle"></i> Reset All Data</h2>
                    <button class="modal-close" onclick="closeModal()">×</button>
                </div>
                <div class="modal-body">
                    <div class="reset-warning">
                        <i class="fas fa-skull-crossbones" style="font-size: 48px; color: #F44336; margin-bottom: 20px;"></i>
                        <h3 style="color: #F44336; margin-bottom: 15px;">⚠️ THIS ACTION CANNOT BE UNDONE!</h3>
                        <p style="margin-bottom: 15px;">
                            Factory reset will permanently delete:
                        </p>
                        <ul style="text-align: left; margin: 0 auto 20px; max-width: 400px;">
                            <li>✗ All Products</li>
                            <li>✗ All Customers</li>
                            <li>✗ All Bills and Invoices</li>
                            <li>✗ All Reports and Analytics</li>
                            <li>✗ All Categories</li>
                            <li>✗ Business Settings</li>
                        </ul>
                        <p style="color: #F44336; font-weight: 600;">
                            The application will restart with a fresh database.
                        </p>
                    </div>
                    <div class="form-group" style="margin-top: 25px;">
                        <label style="font-weight: 600;">Type <strong style="color: #F44336;">DELETE ALL</strong> to confirm:</label>
                        <input type="text" id="reset-confirmation" placeholder="DELETE ALL" 
                               style="border: 2px solid #F44336; text-align: center; font-weight: 600;"
                               autocomplete="off">
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                    <button type="button" class="btn btn-danger" onclick="executeFactoryReset()">
                        <i class="fas fa-trash-restore"></i> Yes, Delete Everything
                    </button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('modal-container').innerHTML = modal;
    
    // Focus on the input field after a short delay
    setTimeout(() => {
        const input = document.getElementById('reset-confirmation');
        if (input) input.focus();
    }, 100);
}

async function executeFactoryReset() {
    const confirmation = document.getElementById('reset-confirmation');
    
    if (!confirmation) return;
    
    if (confirmation.value !== 'DELETE ALL') {
        showToast('Please type "DELETE ALL" to confirm', 'error');
        confirmation.style.borderColor = '#F44336';
        confirmation.focus();
        return;
    }

    // Show loading state
    const resetBtn = event.target;
    const originalText = resetBtn.innerHTML;
    resetBtn.disabled = true;
    resetBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Resetting...';

    try {
        const result = await window.electronAPI.factoryReset();
        
        if (result.success) {
            closeModal();
            showToast('Factory reset completed! Restarting application...', 'success');
            
            // Clear local storage (categories)
            localStorage.clear();
            
            // Clear local state
            allProducts = [];
            allCustomers = [];
            billItems = [];
            
            // Wait 2 seconds then reload the app
            setTimeout(() => {
                location.reload();
            }, 2000);
        } else {
            showToast(result.error || 'Factory reset failed', 'error');
            resetBtn.disabled = false;
            resetBtn.innerHTML = originalText;
        }
    } catch (error) {
        showToast('Factory reset failed: ' + error.message, 'error');
        resetBtn.disabled = false;
        resetBtn.innerHTML = originalText;
    }
}

window.executeFactoryReset = executeFactoryReset;

// ============ UTILITY FUNCTIONS ============
function closeModal(event) {
    if (!event || event.target.classList.contains('modal-overlay')) {
        document.getElementById('modal-container').innerHTML = '';
    }
}

window.closeModal = closeModal;

function showError(elementId, message) {
    const errorEl = document.getElementById(elementId);
    errorEl.textContent = message;
    errorEl.classList.add('show');
    setTimeout(() => errorEl.classList.remove('show'), 5000);
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.getElementById('toast-container').appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// ============================================
// CRM & Loyalty Points Functions
// ============================================

async function initializeCRMPage() {
    await loadCRMStatistics();
    await loadCRMCustomers();
    await loadCRMActivity();
    
    // Setup filters
    document.getElementById('tier-filter')?.addEventListener('change', loadCRMCustomers);
    document.getElementById('sort-by')?.addEventListener('change', loadCRMCustomers);
    document.getElementById('search-crm')?.addEventListener('input', loadCRMCustomers);
}

async function loadCRMStatistics() {
    try {
        const customersResult = await window.electronAPI.customers.getAll();
        const billsResult = await window.electronAPI.bills.getAll();
        
        console.log('CRM Stats - Customers Result:', customersResult);
        console.log('CRM Stats - Bills Result:', billsResult);
        
        if (!customersResult.success || !billsResult.success) {
            throw new Error('Failed to fetch data');
        }
        
        const customers = customersResult.data;
        const bills = billsResult.data;
        
        console.log('CRM Stats - Customers:', customers);
        console.log('CRM Stats - Total Customers:', customers.length);
        
        // Calculate statistics
        const totalCustomers = customers.length;
        const totalPoints = customers.reduce((sum, c) => sum + (c.loyalty_points || 0), 0);
        const avgPoints = totalCustomers > 0 ? Math.round(totalPoints / totalCustomers) : 0;
        
        // Find top customer
        const topCustomer = customers.reduce((max, c) => 
            (c.loyalty_points || 0) > (max.loyalty_points || 0) ? c : max
        , {loyalty_points: 0, name: '-'});
        
        // Update UI with unique CRM IDs
        const totalCustomersEl = document.getElementById('crm-total-customers');
        const totalPointsEl = document.getElementById('crm-total-points-issued');
        const topCustomerEl = document.getElementById('crm-top-customer-name');
        const avgPointsEl = document.getElementById('crm-avg-points');
        
        if (totalCustomersEl) totalCustomersEl.textContent = totalCustomers;
        if (totalPointsEl) totalPointsEl.textContent = totalPoints.toLocaleString();
        if (topCustomerEl) topCustomerEl.textContent = topCustomer.name;
        if (avgPointsEl) avgPointsEl.textContent = avgPoints;
        
        console.log('CRM Stats Updated:', { totalCustomers, totalPoints, topCustomer: topCustomer.name, avgPoints });
        
    } catch (error) {
        console.error('Error loading CRM statistics:', error);
        showToast('Failed to load statistics', 'error');
    }
}

function getCustomerTier(points) {
    if (points >= 500) return 'gold';
    if (points >= 200) return 'silver';
    if (points >= 1) return 'bronze';
    return 'none';
}

function getTierIcon(tier) {
    switch(tier) {
        case 'gold': return '👑';
        case 'silver': return '⭐';
        case 'bronze': return '🥉';
        default: return '·';
    }
}

async function loadCRMCustomers() {
    try {
        const customersResult = await window.electronAPI.customers.getAll();
        const billsResult = await window.electronAPI.bills.getAll();
        
        if (!customersResult.success || !billsResult.success) {
            throw new Error('Failed to fetch data');
        }
        
        const customers = customersResult.data;
        const bills = billsResult.data;
        const tbody = document.getElementById('crm-customers-body');
        const searchTerm = document.getElementById('search-crm')?.value.toLowerCase() || '';
        const tierFilter = document.getElementById('tier-filter')?.value || 'all';
        const sortBy = document.getElementById('sort-by')?.value || 'points-desc';
        
        if (!tbody) return;
        
        // Get last transaction for each customer
        const customerLastTransaction = {};
        bills.forEach(bill => {
            const customerId = bill.customer_id;
            if (!customerLastTransaction[customerId] || 
                new Date(bill.date) > new Date(customerLastTransaction[customerId])) {
                customerLastTransaction[customerId] = bill.date;
            }
        });
        
        // Filter customers
        let filteredCustomers = customers.filter(customer => {
            const points = customer.loyalty_points || 0;
            const tier = getCustomerTier(points);
            const matchesSearch = customer.name.toLowerCase().includes(searchTerm) ||
                                customer.phone.includes(searchTerm) ||
                                (customer.email && customer.email.toLowerCase().includes(searchTerm));
            
            let matchesTier = true;
            if (tierFilter !== 'all') {
                if (tierFilter === 'none') matchesTier = tier === 'none';
                else matchesTier = tier === tierFilter;
            }
            
            return matchesSearch && matchesTier;
        });
        
        // Sort customers
        filteredCustomers.sort((a, b) => {
            switch(sortBy) {
                case 'points-desc':
                    return (b.loyalty_points || 0) - (a.loyalty_points || 0);
                case 'points-asc':
                    return (a.loyalty_points || 0) - (b.loyalty_points || 0);
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'recent':
                    const dateA = customerLastTransaction[a.id] || a.created_at || '1970-01-01';
                    const dateB = customerLastTransaction[b.id] || b.created_at || '1970-01-01';
                    return new Date(dateB) - new Date(dateA);
                default:
                    return 0;
            }
        });
        
        // Render customers
        if (filteredCustomers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <i class="fas fa-users"></i>
                        <h3>No customers found</h3>
                        <p>Try adjusting your filters or search term</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = filteredCustomers.map(customer => {
            const points = customer.loyalty_points || 0;
            const tier = getCustomerTier(points);
            const tierIcon = getTierIcon(tier);
            const initials = customer.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            const lastTransaction = customerLastTransaction[customer.id];
            const lastTransactionDate = lastTransaction ? 
                new Date(lastTransaction).toLocaleDateString('en-IN', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric' 
                }) : 'Never';
            
            return `
                <tr>
                    <td>
                        <div class="customer-info">
                            <div class="customer-avatar">${initials}</div>
                            <div class="customer-details">
                                <div class="customer-name">${customer.name}</div>
                                <div class="customer-id">#${customer.id.toString().padStart(4, '0')}</div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div class="contact-info">
                            <div class="contact-phone">${customer.phone}</div>
                            <div class="contact-email">${customer.email || '-'}</div>
                        </div>
                    </td>
                    <td>
                        <span class="tier-badge ${tier}">
                            ${tierIcon} ${tier}
                        </span>
                    </td>
                    <td>
                        <div class="points-display">
                            <i class="fas fa-coins"></i>
                            ${points.toLocaleString()}
                        </div>
                    </td>
                    <td>${lastTransactionDate}</td>
                    <td>
                        <div class="crm-actions">
                            <button class="btn-icon history" onclick="showCustomerHistory(${customer.id})" title="View History">
                                <i class="fas fa-history"></i>
                            </button>
                            <button class="btn-icon adjust" onclick="adjustCustomerPoints(${customer.id})" title="Adjust Points">
                                <i class="fas fa-coins"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading CRM customers:', error);
        showToast('Failed to load customers', 'error');
    }
}

async function loadCRMActivity() {
    try {
        const billsResult = await window.electronAPI.bills.getAll();
        const customersResult = await window.electronAPI.customers.getAll();
        
        if (!billsResult.success || !customersResult.success) {
            throw new Error('Failed to fetch data');
        }
        
        const bills = billsResult.data;
        const customers = customersResult.data;
        const timeline = document.getElementById('crm-activity-timeline');
        
        if (!timeline) return;
        
        // Create customer lookup
        const customerMap = {};
        customers.forEach(c => customerMap[c.id] = c);
        
        // Get recent bills with points activity
        const recentActivity = bills
            .filter(bill => (bill.points_earned > 0 || bill.points_redeemed > 0))
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 10);
        
        if (recentActivity.length === 0) {
            timeline.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clock"></i>
                    <h3>No activity yet</h3>
                    <p>Points activity will appear here</p>
                </div>
            `;
            return;
        }
        
        timeline.innerHTML = recentActivity.map(bill => {
            const customer = customerMap[bill.customer_id];
            const customerName = customer ? customer.name : 'Unknown Customer';
            const date = new Date(bill.date);
            const timeAgo = getTimeAgo(date);
            
            if (bill.points_earned > 0) {
                return `
                    <div class="activity-item">
                        <div class="activity-icon earned">
                            <i class="fas fa-plus"></i>
                        </div>
                        <div class="activity-content">
                            <div class="activity-title">${customerName}</div>
                            <div class="activity-description">
                                Earned
                                <span class="activity-points positive">+${bill.points_earned} points</span>
                            </div>
                            <div class="activity-time">${timeAgo}</div>
                        </div>
                    </div>
                `;
            } else if (bill.points_redeemed > 0) {
                return `
                    <div class="activity-item">
                        <div class="activity-icon redeemed">
                            <i class="fas fa-minus"></i>
                        </div>
                        <div class="activity-content">
                            <div class="activity-title">${customerName}</div>
                            <div class="activity-description">
                                Redeemed
                                <span class="activity-points negative">-${bill.points_redeemed} points</span>
                            </div>
                            <div class="activity-time">${timeAgo}</div>
                        </div>
                    </div>
                `;
            }
        }).join('');
        
    } catch (error) {
        console.error('Error loading CRM activity:', error);
        showToast('Failed to load activity', 'error');
    }
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    
    return date.toLocaleDateString('en-IN', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
    });
}

async function showCustomerHistory(customerId) {
    try {
        const customersResult = await window.electronAPI.customers.getAll();
        const billsResult = await window.electronAPI.bills.getAll();
        
        if (!customersResult.success || !billsResult.success) {
            throw new Error('Failed to fetch data');
        }
        
        const customer = customersResult.data.find(c => c.id === customerId);
        if (!customer) {
            showToast('Customer not found', 'error');
            return;
        }
        
        const customerBills = billsResult.data.filter(b => b.customer_id === customerId);
        
        let historyHTML = `
            <div class="modal-header">
                <h2><i class="fas fa-history"></i> ${customer.name} - Points History</h2>
            </div>
            <div class="modal-body">
                <div class="customer-points-summary">
                    <div class="points-summary-item">
                        <div class="points-summary-label">Current Balance</div>
                        <div class="points-summary-value">${customer.loyalty_points || 0} points</div>
                    </div>
                    <div class="points-summary-item">
                        <div class="points-summary-label">Total Earned</div>
                        <div class="points-summary-value positive">
                            +${customerBills.reduce((sum, b) => sum + (b.points_earned || 0), 0)} points
                        </div>
                    </div>
                    <div class="points-summary-item">
                        <div class="points-summary-label">Total Redeemed</div>
                        <div class="points-summary-value negative">
                            -${customerBills.reduce((sum, b) => sum + (b.points_redeemed || 0), 0)} points
                        </div>
                    </div>
                </div>
                
                <h3>Transaction History</h3>
                <div class="points-history-list">
        `;
        
        if (customerBills.length === 0) {
            historyHTML += `<p class="no-history">No transactions found</p>`;
        } else {
            customerBills.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(bill => {
                const date = new Date(bill.date).toLocaleDateString('en-IN');
                if (bill.points_earned > 0) {
                    historyHTML += `
                        <div class="history-item earned">
                            <div class="history-icon"><i class="fas fa-plus-circle"></i></div>
                            <div class="history-details">
                                <div class="history-title">Points Earned</div>
                                <div class="history-date">${date}</div>
                            </div>
                            <div class="history-amount positive">+${bill.points_earned}</div>
                        </div>
                    `;
                }
                if (bill.points_redeemed > 0) {
                    historyHTML += `
                        <div class="history-item redeemed">
                            <div class="history-icon"><i class="fas fa-minus-circle"></i></div>
                            <div class="history-details">
                                <div class="history-title">Points Redeemed</div>
                                <div class="history-date">${date}</div>
                            </div>
                            <div class="history-amount negative">-${bill.points_redeemed}</div>
                        </div>
                    `;
                }
            });
        }
        
        historyHTML += `
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal()">Close</button>
            </div>
        `;
        
        showModal(historyHTML);
        
    } catch (error) {
        console.error('Error showing customer history:', error);
        showToast('Failed to load history', 'error');
    }
}

async function adjustCustomerPoints(customerId) {
    try {
        const customersResult = await window.electronAPI.customers.getAll();
        
        if (!customersResult.success) {
            throw new Error('Failed to fetch customers');
        }
        
        const customer = customersResult.data.find(c => c.id === customerId);
        if (!customer) {
            showToast('Customer not found', 'error');
            return;
        }
        
        const modalHTML = `
            <div class="modal-header">
                <h2><i class="fas fa-coins"></i> Adjust Points - ${customer.name}</h2>
            </div>
            <div class="modal-body">
                <div class="current-points-display">
                    <span>Current Balance:</span>
                    <strong>${customer.loyalty_points || 0} points</strong>
                </div>
                
                <form id="adjust-points-form">
                    <div class="form-group">
                        <label>Action</label>
                        <select id="points-action" required>
                            <option value="add">Add Points</option>
                            <option value="subtract">Subtract Points</option>
                            <option value="set">Set Points</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Points</label>
                        <input type="number" id="points-amount" min="0" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Reason</label>
                        <input type="text" id="points-reason" placeholder="e.g., Manual adjustment, Bonus points" required>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="savePointsAdjustment(${customerId})">Save</button>
            </div>
        `;
        
        showModal(modalHTML);
        
    } catch (error) {
        console.error('Error adjusting points:', error);
        showToast('Failed to adjust points', 'error');
    }
}

async function savePointsAdjustment(customerId) {
    try {
        const action = document.getElementById('points-action').value;
        const amount = parseInt(document.getElementById('points-amount').value);
        const reason = document.getElementById('points-reason').value;
        
        if (!amount || amount < 0) {
            showToast('Please enter a valid amount', 'error');
            return;
        }
        
        if (!reason.trim()) {
            showToast('Please enter a reason', 'error');
            return;
        }
        
        const customersResult = await window.electronAPI.customers.getAll();
        if (!customersResult.success) {
            throw new Error('Failed to fetch customer');
        }
        
        const customer = customersResult.data.find(c => c.id === customerId);
        if (!customer) {
            showToast('Customer not found', 'error');
            return;
        }
        
        let newPoints = customer.loyalty_points || 0;
        
        switch(action) {
            case 'add':
                newPoints += amount;
                break;
            case 'subtract':
                newPoints = Math.max(0, newPoints - amount);
                break;
            case 'set':
                newPoints = amount;
                break;
        }
        
        const updateResult = await window.electronAPI.customers.update(customerId, {
            ...customer,
            loyalty_points: newPoints
        });
        
        if (!updateResult.success) {
            throw new Error('Failed to update customer');
        }
        
        closeModal();
        await loadCRMStatistics();
        await loadCRMCustomers();
        await loadCRMActivity();
        
        showToast(`Points adjusted successfully (${action}: ${amount} points)`, 'success');
        
    } catch (error) {
        console.error('Error saving points adjustment:', error);
        showToast('Failed to save adjustment', 'error');
    }
}

// ============================================
// Categories Page Functions
// ============================================

let categoriesData = [];

// Available icons for categories
const categoryIcons = [
    'fa-utensils', 'fa-coffee', 'fa-pizza-slice', 'fa-burger', 'fa-ice-cream',
    'fa-wine-glass', 'fa-beer', 'fa-cocktail', 'fa-mug-hot', 'fa-cake-candles',
    'fa-cookie', 'fa-drumstick-bite', 'fa-fish', 'fa-carrot', 'fa-apple-whole',
    'fa-lemon', 'fa-pepper-hot', 'fa-cheese', 'fa-bread-slice', 'fa-candy-cane',
    'fa-tags', 'fa-box', 'fa-cubes', 'fa-gift', 'fa-heart',
    'fa-star', 'fa-fire', 'fa-bolt', 'fa-leaf', 'fa-sun'
];

// Available colors for categories
const categoryColors = [
    { start: '#FF6B6B', end: '#FF8E8E', name: 'Red' },
    { start: '#4ECDC4', end: '#6FE7DD', name: 'Teal' },
    { start: '#FFD93D', end: '#FFE569', name: 'Yellow' },
    { start: '#95E1D3', end: '#B8F2E6', name: 'Mint' },
    { start: '#A8E6CF', end: '#C4F1DF', name: 'Green' },
    { start: '#FFB6B9', end: '#FFC8CB', name: 'Pink' },
    { start: '#C7CEEA', end: '#D9DEEF', name: 'Lavender' },
    { start: '#FECA57', end: '#FFD56F', name: 'Orange' },
    { start: '#54A0FF', end: '#74B4FF', name: 'Blue' },
    { start: '#9D84B7', end: '#B59BCF', name: 'Purple' },
    { start: '#F8B500', end: '#FFC733', name: 'Gold' },
    { start: '#45B7D1', end: '#5DC9E2', name: 'Cyan' }
];

async function initializeCategoriesPage() {
    await loadCategories();
    
    document.getElementById('add-category-btn')?.addEventListener('click', showAddCategoryModal);
    document.getElementById('search-categories')?.addEventListener('input', filterCategories);
    document.getElementById('clear-categories-btn')?.addEventListener('click', clearAllCategories);
}

async function clearAllCategories() {
    if (categoriesData.length === 0) {
        showToast('No categories to clear', 'info');
        return;
    }
    
    const confirmed = confirm(`Are you sure you want to delete all ${categoriesData.length} categories?\n\nThis action cannot be undone.`);
    
    if (confirmed) {
        try {
            localStorage.removeItem('categories');
            categoriesData = [];
            renderCategories(categoriesData);
            showToast('All categories cleared successfully', 'success');
        } catch (error) {
            console.error('Error clearing categories:', error);
            showToast('Failed to clear categories', 'error');
        }
    }
}

async function loadCategories() {
    try {
        // Load categories from localStorage (or you can create a database table)
        const savedCategories = localStorage.getItem('categories');
        categoriesData = savedCategories ? JSON.parse(savedCategories) : getDefaultCategories();
        
        // Get products to count category usage
        const productsResult = await window.electronAPI.products.getAll();
        if (productsResult.success) {
            const products = productsResult.data;
            
            // Count products per category
            categoriesData.forEach(category => {
                category.productCount = products.filter(p => p.category === category.name).length;
            });
        }
        
        renderCategories(categoriesData);
        
    } catch (error) {
        console.error('Error loading categories:', error);
        showToast('Failed to load categories', 'error');
    }
}

function getDefaultCategories() {
    return [];
}

function renderCategories(categories) {
    const grid = document.getElementById('categories-grid');
    
    if (!grid) return;
    
    if (categories.length === 0) {
        grid.innerHTML = `
            <div class="categories-empty">
                <i class="fas fa-tags"></i>
                <h3>No categories yet</h3>
                <p>Click "Add Category" to create your first category</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = categories.map(category => `
        <div class="category-card" style="--category-color: ${category.color.start}; --category-color-end: ${category.color.end}" onclick="viewCategoryProducts('${category.name}')">
            <div class="category-icon-wrapper">
                <i class="fas ${category.icon}"></i>
            </div>
            <div class="category-name">${category.name}</div>
            <div class="category-stats">
                <div class="category-stat">
                    <span class="category-stat-value">${category.productCount || 0}</span>
                    <span class="category-stat-label">Products</span>
                </div>
            </div>
            <div class="category-view-hint">
                <i class="fas fa-arrow-right"></i> Click to view products
            </div>
            <div class="category-actions" onclick="event.stopPropagation()">
                <button class="btn-icon edit" onclick="editCategory(${category.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon delete" onclick="deleteCategory(${category.id})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function viewCategoryProducts(categoryName) {
    // Switch to products page
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.querySelector('.nav-item[data-page="products"]')?.classList.add('active');
    
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('products-page')?.classList.add('active');
    
    // Load products and set filter
    loadProducts().then(() => {
        const filterSelect = document.getElementById('filter-category');
        if (filterSelect) {
            filterSelect.value = categoryName;
            filterProductsByCategory();
        }
    });
}

function filterCategories() {
    const searchTerm = document.getElementById('search-categories')?.value.toLowerCase() || '';
    const filtered = categoriesData.filter(cat => 
        cat.name.toLowerCase().includes(searchTerm)
    );
    renderCategories(filtered);
}

function showAddCategoryModal() {
    const modalHTML = `
        <div class="modal-overlay">
            <div class="modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2><i class="fas fa-plus"></i> Add New Category</h2>
                    <button class="modal-close" onclick="closeModal()">×</button>
                </div>
                <div class="modal-body">
                    <div class="category-preview">
                        <div class="preview-icon" id="preview-icon" style="--preview-color: ${categoryColors[0].start}; --preview-color-end: ${categoryColors[0].end}">
                            <i class="fas fa-utensils"></i>
                        </div>
                        <div class="preview-name" id="preview-name">Category Name</div>
                    </div>
                    
                    <form id="category-form">
                        <div class="form-group">
                            <label>Category Name *</label>
                            <input type="text" id="category-name" placeholder="e.g., Beverages" required>
                        </div>
                        
                        <div class="form-group">
                            <label>Choose Icon *</label>
                            <div class="icon-picker" id="icon-picker"></div>
                        </div>
                        
                        <div class="form-group">
                            <label>Choose Color *</label>
                            <div class="color-picker" id="color-picker"></div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button class="btn btn-primary" onclick="saveCategory()">Save Category</button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modal-container').innerHTML = modalHTML;
    
    // Initialize icon picker
    const iconPicker = document.getElementById('icon-picker');
    iconPicker.innerHTML = categoryIcons.map((icon, index) => `
        <div class="icon-option ${index === 0 ? 'selected' : ''}" data-icon="${icon}" onclick="selectIcon('${icon}')">
            <i class="fas ${icon}"></i>
        </div>
    `).join('');
    
    // Initialize color picker
    const colorPicker = document.getElementById('color-picker');
    colorPicker.innerHTML = categoryColors.map((color, index) => `
        <div class="color-option ${index === 0 ? 'selected' : ''}" 
             style="background: linear-gradient(135deg, ${color.start}, ${color.end})"
             data-color-index="${index}"
             onclick="selectColor(${index})"></div>
    `).join('');
    
    // Live preview
    document.getElementById('category-name')?.addEventListener('input', updateCategoryPreview);
    
    // Store selected values
    window.selectedCategoryIcon = 'fa-utensils';
    window.selectedCategoryColorIndex = 0;
}

function selectIcon(icon) {
    document.querySelectorAll('.icon-option').forEach(opt => opt.classList.remove('selected'));
    document.querySelector(`[data-icon="${icon}"]`)?.classList.add('selected');
    window.selectedCategoryIcon = icon;
    updateCategoryPreview();
}

function selectColor(colorIndex) {
    document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
    document.querySelector(`[data-color-index="${colorIndex}"]`)?.classList.add('selected');
    window.selectedCategoryColorIndex = colorIndex;
    updateCategoryPreview();
}

function updateCategoryPreview() {
    const name = document.getElementById('category-name')?.value || 'Category Name';
    const icon = window.selectedCategoryIcon || 'fa-utensils';
    const color = categoryColors[window.selectedCategoryColorIndex || 0];
    
    const previewIcon = document.getElementById('preview-icon');
    const previewName = document.getElementById('preview-name');
    
    if (previewIcon) {
        previewIcon.style.setProperty('--preview-color', color.start);
        previewIcon.style.setProperty('--preview-color-end', color.end);
        previewIcon.innerHTML = `<i class="fas ${icon}"></i>`;
    }
    
    if (previewName) {
        previewName.textContent = name;
    }
}

async function saveCategory(editId = null) {
    try {
        const name = document.getElementById('category-name')?.value.trim();
        
        if (!name) {
            showToast('Please enter a category name', 'error');
            return;
        }
        
        const icon = window.selectedCategoryIcon || 'fa-utensils';
        const color = categoryColors[window.selectedCategoryColorIndex || 0];
        
        if (editId) {
            // Update existing category
            const index = categoriesData.findIndex(c => c.id === editId);
            if (index !== -1) {
                categoriesData[index] = {
                    ...categoriesData[index],
                    name,
                    icon,
                    color
                };
            }
        } else {
            // Add new category
            const newCategory = {
                id: Date.now(),
                name,
                icon,
                color,
                productCount: 0
            };
            categoriesData.push(newCategory);
        }
        
        // Save to localStorage
        localStorage.setItem('categories', JSON.stringify(categoriesData));
        
        closeModal();
        await loadCategories();
        
        showToast(editId ? 'Category updated successfully' : 'Category added successfully', 'success');
        
    } catch (error) {
        console.error('Error saving category:', error);
        showToast('Failed to save category', 'error');
    }
}

async function editCategory(categoryId) {
    const category = categoriesData.find(c => c.id === categoryId);
    if (!category) return;
    
    const modalHTML = `
        <div class="modal-overlay">
            <div class="modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2><i class="fas fa-edit"></i> Edit Category</h2>
                    <button class="modal-close" onclick="closeModal()">×</button>
                </div>
                <div class="modal-body">
                    <div class="category-preview">
                        <div class="preview-icon" id="preview-icon" style="--preview-color: ${category.color.start}; --preview-color-end: ${category.color.end}">
                            <i class="fas ${category.icon}"></i>
                        </div>
                        <div class="preview-name" id="preview-name">${category.name}</div>
                    </div>
                    
                    <form id="category-form">
                        <div class="form-group">
                            <label>Category Name *</label>
                            <input type="text" id="category-name" value="${category.name}" placeholder="e.g., Beverages" required>
                        </div>
                        
                        <div class="form-group">
                            <label>Choose Icon *</label>
                            <div class="icon-picker" id="icon-picker"></div>
                        </div>
                        
                        <div class="form-group">
                            <label>Choose Color *</label>
                            <div class="color-picker" id="color-picker"></div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button class="btn btn-primary" onclick="saveCategory(${categoryId})">Update Category</button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modal-container').innerHTML = modalHTML;
    
    // Initialize icon picker
    const iconPicker = document.getElementById('icon-picker');
    iconPicker.innerHTML = categoryIcons.map(icon => `
        <div class="icon-option ${icon === category.icon ? 'selected' : ''}" data-icon="${icon}" onclick="selectIcon('${icon}')">
            <i class="fas ${icon}"></i>
        </div>
    `).join('');
    
    // Initialize color picker
    const colorIndex = categoryColors.findIndex(c => c.start === category.color.start);
    const colorPicker = document.getElementById('color-picker');
    colorPicker.innerHTML = categoryColors.map((color, index) => `
        <div class="color-option ${index === colorIndex ? 'selected' : ''}" 
             style="background: linear-gradient(135deg, ${color.start}, ${color.end})"
             data-color-index="${index}"
             onclick="selectColor(${index})"></div>
    `).join('');
    
    // Live preview
    document.getElementById('category-name')?.addEventListener('input', updateCategoryPreview);
    
    // Store selected values
    window.selectedCategoryIcon = category.icon;
    window.selectedCategoryColorIndex = colorIndex;
}

async function deleteCategory(categoryId) {
    const category = categoriesData.find(c => c.id === categoryId);
    if (!category) return;
    
    const confirmed = confirm(`Are you sure you want to delete "${category.name}"?\nThis action cannot be undone.`);
    
    if (confirmed) {
        try {
            categoriesData = categoriesData.filter(c => c.id !== categoryId);
            localStorage.setItem('categories', JSON.stringify(categoriesData));
            
            await loadCategories();
            showToast('Category deleted successfully', 'success');
            
        } catch (error) {
            console.error('Error deleting category:', error);
            showToast('Failed to delete category', 'error');
        }
    }
}

// Expose category functions to window
window.saveCategory = saveCategory;
window.editCategory = editCategory;
window.deleteCategory = deleteCategory;
window.selectIcon = selectIcon;
window.selectColor = selectColor;
window.viewCategoryProducts = viewCategoryProducts;
window.showAddCategoryModal = showAddCategoryModal;
window.updateCategoryPreview = updateCategoryPreview;
window.clearAllCategories = clearAllCategories;

