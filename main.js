// main.js - Electron Main Process
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const DatabaseManager = require('./src/database/dbManager');
const InvoiceGenerator = require('./src/services/invoiceGenerator');

let mainWindow;
let db;
let invoiceGen;

// Initialize database and invoice generator
async function initializeServices() {
  const dbPath = path.join(app.getPath('userData'), 'billing.db');
  db = new DatabaseManager(dbPath);
  await db.ready; // Wait for async initialization
  invoiceGen = new InvoiceGenerator(path.join(app.getPath('userData'), 'invoices'));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    icon: __dirname + '/src/assets/icon.png',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false, // Don't show until ready
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));


  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools in development mode
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  await initializeServices();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers

// Authentication
ipcMain.handle('user:login', async (event, { username, password }) => {
  try {
    const user = db.authenticateUser(username, password);
    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Dashboard Stats
ipcMain.handle('dashboard:getStats', async () => {
  try {
    const stats = db.getDashboardStats();
    return { success: true, data: stats };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Customer Operations
ipcMain.handle('customers:getAll', async () => {
  try {
    const customers = db.getAllCustomers();
    return { success: true, data: customers };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('customers:add', async (event, customer) => {
  try {
    const id = db.addCustomer(customer);
    return { success: true, id };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('customers:update', async (event, { id, customer }) => {
  try {
    db.updateCustomer(id, customer);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('customers:delete', async (event, id) => {
  try {
    db.deleteCustomer(id);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('customers:search', async (event, query) => {
  try {
    const customers = db.searchCustomers(query);
    return { success: true, data: customers };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Product Operations
ipcMain.handle('products:getAll', async () => {
  try {
    const products = db.getAllProducts();
    return { success: true, data: products };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('products:add', async (event, product) => {
  try {
    const id = db.addProduct(product);
    return { success: true, id };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('products:update', async (event, { id, product }) => {
  try {
    db.updateProduct(id, product);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('products:delete', async (event, id) => {
  try {
    db.deleteProduct(id);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('products:search', async (event, query) => {
  try {
    const products = db.searchProducts(query);
    return { success: true, data: products };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Bill Operations
ipcMain.handle('bills:create', async (event, billData) => {
  try {
    const billId = db.createBill(billData);
    
    // Generate PDF invoice
    const bill = db.getBillById(billId);
    const pdfPath = await invoiceGen.generateInvoice(bill);
    
    return { success: true, billId, pdfPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('bills:getAll', async (event, { startDate, endDate } = {}) => {
  try {
    const bills = db.getAllBills(startDate, endDate);
    return { success: true, data: bills };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('bills:getById', async (event, id) => {
  try {
    const bill = db.getBillById(id);
    return { success: true, data: bill };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('bills:delete', async (event, id) => {
  try {
    db.deleteBill(id);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Reports
ipcMain.handle('reports:getSales', async (event, { period, startDate, endDate }) => {
  try {
    const report = db.getSalesReport(period, startDate, endDate);
    return { success: true, data: report };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('reports:getCustomerHistory', async (event, customerId) => {
  try {
    const history = db.getCustomerPurchaseHistory(customerId);
    return { success: true, data: history };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Open PDF
ipcMain.handle('invoice:open', async (event, pdfPath) => {
  try {
    const { shell } = require('electron');
    await shell.openPath(pdfPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Export data
ipcMain.handle('export:data', async (event, { type, data }) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Export Data',
      defaultPath: `${type}_${Date.now()}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }]
    });

    if (!result.canceled) {
      fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2));
      return { success: true, path: result.filePath };
    }
    return { success: false, error: 'Export cancelled' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Backup database
ipcMain.handle('database:backup', async () => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Backup Database',
      defaultPath: `billing_backup_${Date.now()}.db`,
      filters: [{ name: 'Database', extensions: ['db'] }]
    });

    if (!result.canceled) {
      const sourcePath = path.join(app.getPath('userData'), 'billing.db');
      fs.copyFileSync(sourcePath, result.filePath);
      return { success: true, path: result.filePath };
    }
    return { success: false, error: 'Backup cancelled' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Select image file
ipcMain.handle('dialog:selectImage', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Product Image',
      filters: [
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] }
      ],
      properties: ['openFile']
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const imagePath = result.filePaths[0];
      // Read image and convert to base64
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = `data:image/${path.extname(imagePath).slice(1)};base64,${imageBuffer.toString('base64')}`;
      return { success: true, image: base64Image, path: imagePath };
    }
    return { success: false, error: 'No file selected' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Factory Reset
ipcMain.handle('database:factoryReset', async () => {
  try {
    const dbPath = path.join(app.getPath('userData'), 'billing.db');
    
    // Close the database connection
    db.close();
    
    // Delete the database file
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
    
    // Delete WAL and SHM files if they exist (from old better-sqlite3 - no longer needed)
    const walPath = dbPath + '-wal';
    const shmPath = dbPath + '-shm';
    if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
    if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
    
    // Reinitialize the database with the correct path
    db = new DatabaseManager(dbPath);
    await db.ready; // Wait for async initialization
    
    // Reinitialize invoice generator
    invoiceGen = new InvoiceGenerator(path.join(app.getPath('userData'), 'invoices'));
    
    return { success: true, message: 'Factory reset completed successfully' };
  } catch (error) {
    console.error('Factory reset error:', error);
    return { success: false, error: error.message };
  }
});

// Send bill via WhatsApp
ipcMain.handle('whatsapp:sendBill', async (event, { billId, phoneNumber }) => {
  try {
    const bill = db.getBillById(billId);
    if (!bill) {
      throw new Error('Bill not found');
    }
    
    // Get business settings
    const settingsStr = await mainWindow.webContents.executeJavaScript('localStorage.getItem("businessSettings")');
    const settings = settingsStr ? JSON.parse(settingsStr) : {};
    const businessName = settings.businessName || 'My Shop';
    const businessPhone = settings.businessPhone || '';
    const businessAddress = settings.businessAddress || '';
    
    // Format bill message (without emojis for better compatibility)
    let message = `*${businessName}*\n`;
    if (businessAddress) message += `Address: ${businessAddress}\n`;
    if (businessPhone) message += `Phone: ${businessPhone}\n`;
    message += `\n================================\n`;
    message += `*BILL #${bill.id}*\n`;
    message += `================================\n\n`;
    
    // Date and customer info
    const date = new Date(bill.date);
    message += `Date: ${date.toLocaleDateString('en-IN')} ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}\n`;
    message += `Customer: ${bill.customer_name}\n`;
    message += `Phone: ${bill.customer_phone}\n`;
    message += `Payment: ${bill.payment_mode.toUpperCase()}\n\n`;
    
    // Items
    message += `*ITEMS:*\n`;
    message += `--------------------------------\n`;
    bill.items.forEach((item, index) => {
      message += `${index + 1}. ${item.product_name}\n`;
      message += `   ${item.quantity} x Rs.${item.price.toFixed(2)} = Rs.${item.total.toFixed(2)}\n`;
    });
    
    // Summary
    message += `\n================================\n`;
    message += `*SUMMARY:*\n`;
    message += `================================\n`;
    message += `Subtotal: Rs.${bill.subtotal.toFixed(2)}\n`;
    if (bill.tax > 0) {
      message += `Tax: Rs.${bill.tax.toFixed(2)}\n`;
    }
    if (bill.discount > 0) {
      message += `Discount: -Rs.${bill.discount.toFixed(2)}\n`;
    }
    message += `\n*TOTAL: Rs.${bill.total.toFixed(2)}*\n`;
    message += `================================\n\n`;
    message += `Thank you for your business!\n`;
    message += `Visit us again!`;
    
    // Clean phone number (remove spaces, dashes, etc.)
    let cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    
    // If phone doesn't have country code, assume India (+91)
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone;
    }
    
    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    
    // Open WhatsApp in browser
    await shell.openExternal(whatsappUrl);
    
    return { success: true, message: 'Opening WhatsApp...' };
  } catch (error) {
    console.error('WhatsApp send error:', error);
    return { success: false, error: error.message };
  }
});
