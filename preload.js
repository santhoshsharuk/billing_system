// preload.js - Bridge between main and renderer process
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // User Authentication
  login: (credentials) => ipcRenderer.invoke('user:login', credentials),

  // Dashboard
  getDashboardStats: () => ipcRenderer.invoke('dashboard:getStats'),

  // Customer Operations
  customers: {
    getAll: () => ipcRenderer.invoke('customers:getAll'),
    add: (customer) => ipcRenderer.invoke('customers:add', customer),
    update: (id, customer) => ipcRenderer.invoke('customers:update', { id, customer }),
    delete: (id) => ipcRenderer.invoke('customers:delete', id),
    search: (query) => ipcRenderer.invoke('customers:search', query),
  },

  // Product Operations
  products: {
    getAll: () => ipcRenderer.invoke('products:getAll'),
    add: (product) => ipcRenderer.invoke('products:add', product),
    update: (id, product) => ipcRenderer.invoke('products:update', { id, product }),
    delete: (id) => ipcRenderer.invoke('products:delete', id),
    search: (query) => ipcRenderer.invoke('products:search', query),
  },

  // Bill Operations
  bills: {
    create: (billData) => ipcRenderer.invoke('bills:create', billData),
    getAll: (filters) => ipcRenderer.invoke('bills:getAll', filters),
    getById: (id) => ipcRenderer.invoke('bills:getById', id),
    delete: (id) => ipcRenderer.invoke('bills:delete', id),
  },

  // Reports
  reports: {
    getSales: (params) => ipcRenderer.invoke('reports:getSales', params),
    getCustomerHistory: (customerId) => ipcRenderer.invoke('reports:getCustomerHistory', customerId),
  },

  // Invoice
  invoice: {
    open: (pdfPath) => ipcRenderer.invoke('invoice:open', pdfPath),
  },

  // WhatsApp
  whatsapp: {
    sendBill: (data) => ipcRenderer.invoke('whatsapp:sendBill', data),
  },

  // Export & Backup
  export: (type, data) => ipcRenderer.invoke('export:data', { type, data }),
  backup: () => ipcRenderer.invoke('database:backup'),
  factoryReset: () => ipcRenderer.invoke('database:factoryReset'),

  // File Dialog
  selectImage: () => ipcRenderer.invoke('dialog:selectImage'),
});
