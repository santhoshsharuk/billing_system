# Billing System - Electron.js Desktop Application

A modern, feature-rich desktop billing system built with **Electron.js** for Windows, Mac, and Linux.

![Billing System](https://img.shields.io/badge/Electron-28.0.0-blue)
![License](https://img.shields.io/badge/license-ISC-green)

## 🚀 Features

### ✅ Core Functionality
- **User Authentication** - Secure login system
- **Dashboard** - Real-time sales overview with charts
- **Create Bills/Invoices** - Quick billing with auto-calculations
- **Customer Management** - Add, edit, delete, and search customers
- **Product Management** - Manage product inventory with stock tracking
- **PDF Invoice Generation** - Professional invoices with auto-print
- **Reports** - Daily, weekly, monthly sales reports
- **Database Backup** - Export and backup functionality

### 📊 Business Features
- Auto tax calculation
- Multiple payment modes (Cash, UPI, Card, Cheque)
- Stock management and low-stock alerts
- Customer purchase history
- Sales analytics with Chart.js
- Search functionality across all modules

### 💻 Technical Features
- **SQLite Database** - Local, lightweight database
- **Responsive UI** - Modern, clean interface
- **Desktop Native** - Cross-platform support
- **PDF Export** - Invoice generation with PDFKit
- **Data Export** - JSON export capability

---

## 🛠️ Installation & Setup

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** (comes with Node.js)

### Installation Steps

1. **Clone or navigate to the project**
```powershell
cd d:\Santhosh_Project\billing_sys
```

2. **Install dependencies**
```powershell
npm install
```

3. **Run the application**
```powershell
npm start
```

---

## 📦 Project Structure

```
billing-system/
├── main.js                    # Electron main process
├── preload.js                 # IPC bridge
├── package.json               # Dependencies & scripts
├── src/
│   ├── index.html            # Main HTML
│   ├── renderer.js           # Frontend logic
│   ├── styles/
│   │   └── main.css         # Styling
│   ├── database/
│   │   └── dbManager.js     # SQLite database manager
│   ├── services/
│   │   └── invoiceGenerator.js  # PDF invoice generator
│   └── assets/
│       └── icon.png         # App icon
├── db/
│   └── billing.db           # SQLite database (auto-created)
└── invoices/
    └── generated-pdfs/      # Invoice storage
```

---

## 🔐 Default Login Credentials

```
Username: admin
Password: admin123
```

> ⚠️ **Important**: Change the default password in production!

---

## 📊 Database Schema

### Tables:
1. **users** - User authentication
2. **customers** - Customer information
3. **products** - Product catalog
4. **bills** - Invoice records
5. **bill_items** - Line items for each bill

### Relationships:
- Bills → Customers (Many-to-One)
- Bill Items → Bills (Many-to-One)
- Bill Items → Products (Many-to-One)

---

## 🧪 Usage Guide

### 1️⃣ Dashboard
- View today's sales, total bills, customers, and products
- See sales trends in the chart
- Quick access to recent bills

### 2️⃣ Create Bill
1. Select customer (or add new)
2. Add products with quantities
3. Review auto-calculated totals (subtotal + tax)
4. Choose payment mode
5. Generate & print PDF invoice

### 3️⃣ Manage Customers
- Add new customers with contact details
- Search by name, phone, or email
- Edit or delete existing customers

### 4️⃣ Manage Products
- Add products with price, tax, and stock
- Track inventory levels
- Update stock automatically on sales

### 5️⃣ Reports
- View sales by period (today, week, month, custom)
- Export reports as JSON
- Customer purchase history

### 6️⃣ Settings
- Update business information
- Backup database
- Configure invoice details

---

## 🎨 Customization

### Update Business Info
Edit in `src/services/invoiceGenerator.js`:
```javascript
.text('MY SHOP', 50, 50)
.text('123 Main Street, City, State', 50, 80)
.text('Phone: +91 9876543210', 50, 95)
.text('GST: XXXXXXXXXXXX', 50, 110)
```

### Change Colors/Theme
Edit CSS variables in `src/styles/main.css`:
```css
:root {
    --primary: #2196F3;
    --success: #4CAF50;
    --danger: #f44336;
    /* ... */
}
```

---

## 📦 Building for Production

### Build for Windows
```powershell
npm run build-win
```

### Build for Mac
```bash
npm run build-mac
```

### Build for Linux
```bash
npm run build-linux
```

**Output**: Installers will be in the `dist/` folder

---

## 🔧 Troubleshooting

### Issue: "better-sqlite3" installation fails
**Solution**: Install build tools
```powershell
npm install --global windows-build-tools
```

### Issue: PDF not opening
**Solution**: Check default PDF viewer is set in your OS

### Issue: Database locked
**Solution**: Close all instances of the app and restart

---

## 🚀 Future Enhancements

- [ ] Cloud sync (Firebase/Google Drive)
- [ ] Multi-user support (Admin/Cashier roles)
- [ ] Barcode/QR code scanning
- [ ] Email invoices directly
- [ ] GST-compliant format (India)
- [ ] Multi-currency support
- [ ] Dark mode theme
- [ ] Auto backup scheduling
- [ ] Product categories
- [ ] Discount management
- [ ] Payment due tracking

---

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Run the app in development mode |
| `npm run dev` | Run with DevTools open |
| `npm run build` | Build for all platforms |
| `npm run build-win` | Build Windows installer |
| `npm run build-mac` | Build macOS installer |
| `npm run build-linux` | Build Linux installer |

---

## 🛡️ Security Notes

1. **Change default password** after first login
2. **Backup database regularly** using the built-in backup feature
3. **Store backups securely** (external drive/cloud)
4. Database is stored locally in user data folder

### Database Location:
- **Windows**: `C:\Users\<Username>\AppData\Roaming\billing_sys\`
- **Mac**: `~/Library/Application Support/billing_sys/`
- **Linux**: `~/.config/billing_sys/`

---

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

---

## 📄 License

ISC License - Feel free to use and modify for your needs.

---

## 👨‍💻 Tech Stack

| Technology | Purpose |
|------------|---------|
| Electron.js | Desktop framework |
| SQLite (better-sqlite3) | Database |
| PDFKit | Invoice generation |
| Chart.js | Data visualization |
| Vanilla JavaScript | Frontend logic |
| CSS3 | Styling |

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the usage guide
3. Open an issue on GitHub

---

**Built with ❤️ using Electron.js**
