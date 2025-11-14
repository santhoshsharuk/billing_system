// invoiceGenerator.js - PDF Invoice Generator
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class InvoiceGenerator {
    constructor(invoicesDir) {
        this.invoicesDir = invoicesDir;
        
        // Create invoices directory if it doesn't exist
        if (!fs.existsSync(invoicesDir)) {
            fs.mkdirSync(invoicesDir, { recursive: true });
        }
    }

    async generateInvoice(billData) {
        return new Promise((resolve, reject) => {
            try {
                // Create filename
                const filename = `invoice_${billData.id}_${Date.now()}.pdf`;
                const filepath = path.join(this.invoicesDir, filename);

                // Create PDF document
                const doc = new PDFDocument({ margin: 50 });

                // Pipe to file
                const stream = fs.createWriteStream(filepath);
                doc.pipe(stream);

                // Generate invoice content
                this.generateHeader(doc);
                this.generateCustomerInfo(doc, billData);
                this.generateInvoiceTable(doc, billData);
                this.generateFooter(doc);

                // Finalize PDF
                doc.end();

                stream.on('finish', () => {
                    resolve(filepath);
                });

                stream.on('error', (error) => {
                    reject(error);
                });

            } catch (error) {
                reject(error);
            }
        });
    }

    generateHeader(doc) {
        doc
            .fillColor('#2196F3')
            .fontSize(24)
            .text('MY SHOP', 50, 50)
            .fontSize(10)
            .fillColor('#666')
            .text('123 Main Street, City, State', 50, 80)
            .text('Phone: +91 9876543210', 50, 95)
            .text('GST: XXXXXXXXXXXX', 50, 110)
            .moveDown();

        // Invoice title
        doc
            .fillColor('#2196F3')
            .fontSize(20)
            .text('INVOICE', 400, 50, { align: 'right' });
    }

    generateCustomerInfo(doc, billData) {
        const customerInfoTop = 150;

        // Bill info
        doc
            .fillColor('#000')
            .fontSize(10)
            .font('Helvetica-Bold')
            .text('Invoice Number:', 50, customerInfoTop)
            .font('Helvetica')
            .text(`#${billData.id}`, 150, customerInfoTop)
            .font('Helvetica-Bold')
            .text('Invoice Date:', 50, customerInfoTop + 15)
            .font('Helvetica')
            .text(new Date(billData.date).toLocaleDateString(), 150, customerInfoTop + 15)
            .font('Helvetica-Bold')
            .text('Payment Mode:', 50, customerInfoTop + 30)
            .font('Helvetica')
            .text(billData.payment_mode.toUpperCase(), 150, customerInfoTop + 30);

        // Customer info
        doc
            .font('Helvetica-Bold')
            .text('Bill To:', 350, customerInfoTop)
            .font('Helvetica')
            .text(billData.customer_name, 350, customerInfoTop + 15)
            .text(billData.customer_phone, 350, customerInfoTop + 30);

        if (billData.customer_email) {
            doc.text(billData.customer_email, 350, customerInfoTop + 45);
        }

        if (billData.customer_address) {
            doc.text(billData.customer_address, 350, customerInfoTop + 60, {
                width: 200,
                align: 'left'
            });
        }
    }

    generateInvoiceTable(doc, billData) {
        const tableTop = 280;
        const itemCodeX = 50;
        const descriptionX = 100;
        const hasTax = billData.tax > 0;
        
        // Adjust column positions based on whether tax is shown
        const quantityX = hasTax ? 300 : 320;
        const priceX = hasTax ? 360 : 390;
        const taxX = 420;
        const amountX = hasTax ? 450 : 450;
        const amountWidth = 95; // Width for right-aligned amount column

        // Table header
        doc
            .fillColor('#2196F3')
            .rect(50, tableTop, 495, 25)
            .fill()
            .fillColor('#FFF')
            .font('Helvetica-Bold')
            .fontSize(10)
            .text('No', itemCodeX, tableTop + 8)
            .text('Description', descriptionX, tableTop + 8)
            .text('Qty', quantityX, tableTop + 8)
            .text('Price', priceX, tableTop + 8);
        
        // Only show Tax column if there's tax
        if (hasTax) {
            doc.text('Tax', taxX, tableTop + 8);
        }
        
        doc.text('Amount', amountX, tableTop + 8, { width: amountWidth, align: 'right' });

        // Table rows
        let position = tableTop + 35;
        doc.fillColor('#000').font('Helvetica').fontSize(10);

        billData.items.forEach((item, index) => {
            const itemSubtotal = item.price * item.quantity;
            const itemTax = (itemSubtotal * item.tax) / 100;
            const itemTotal = itemSubtotal + itemTax;

            doc
                .text(index + 1, itemCodeX, position)
                .text(item.product_name, descriptionX, position, { width: 180 })
                .text(item.quantity, quantityX, position)
                .text(`₹${item.price.toFixed(2)}`, priceX, position);
            
            // Only show tax if there's tax
            if (hasTax) {
                doc.text(`${item.tax}%`, taxX, position);
            }
            
            doc.text(`₹${itemTotal.toFixed(2)}`, amountX, position, { width: amountWidth, align: 'right' });

            position += 25;

            // Add new page if needed
            if (position > 700) {
                doc.addPage();
                position = 50;
            }
        });

        // Draw line
        doc
            .strokeColor('#ccc')
            .lineWidth(1)
            .moveTo(50, position + 5)
            .lineTo(545, position + 5)
            .stroke();

        // Totals
        position += 20;

        doc
            .fillColor('#000')
            .font('Helvetica')
            .fontSize(11)
            .text('Subtotal:', 380, position)
            .text(`₹${billData.subtotal.toFixed(2)}`, 480, position, { align: 'right' });

        // Only show tax row if there's tax
        if (hasTax) {
            position += 20;
            doc
                .text('Tax:', 380, position)
                .text(`₹${billData.tax.toFixed(2)}`, 480, position, { align: 'right' });
        }

        position += 20;

        doc
            .fillColor('#2196F3')
            .font('Helvetica-Bold')
            .fontSize(14)
            .text('Total Amount:', 380, position)
            .text(`₹${billData.total.toFixed(2)}`, 480, position, { align: 'right' });
    }

    generateFooter(doc) {
        doc
            .fontSize(10)
            .fillColor('#666')
            .text(
                'Thank you for your business!',
                50,
                730,
                { align: 'center', width: 500 }
            )
            .fontSize(8)
            .text(
                'This is a computer-generated invoice and does not require a signature.',
                50,
                745,
                { align: 'center', width: 500 }
            );
    }
}

module.exports = InvoiceGenerator;
