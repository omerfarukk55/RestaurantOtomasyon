// controllers/creditBookController.js
const { sql } = require('../../config/database');
const logger = require('../services/logger');
const ExcelJS = require('exceljs');
const path = require('path');

const creditBookController = {
    // Yeni veresiye müşterisi ekleme
    addCustomer: async (req, res) => {
        try {
            const {
                customer_name,
                phone,
                address,
                notes
            } = req.body;

            const result = await sql.query`
                INSERT INTO credit_book (
                    customer_name,
                    phone,
                    address,
                    total_credit,
                    notes,
                    is_active
                )
                VALUES (
                    ${customer_name},
                    ${phone},
                    ${address},
                    0,
                    ${notes},
                    1
                )
                SELECT SCOPE_IDENTITY() as id
            `;

            res.status(201).json({
                message: 'Veresiye müşterisi başarıyla eklendi',
                customerId: result.recordset[0].id
            });
        } catch (error) {
            logger.error('Veresiye müşterisi eklenirken hata:', error);
            res.status(500).json({ message: error.message });
        }
    },

    // Borç ekleme
    addDebt: async (req, res) => {
        try {
            const {
                credit_book_id,
                amount,
                description,
                date
            } = req.body;

            // Borç işlemini kaydet
            await sql.query`
                INSERT INTO credit_transactions (
                    credit_book_id,
                    transaction_type,
                    amount,
                    description,
                    transaction_date,
                    created_by
                )
                VALUES (
                    ${credit_book_id},
                    'debit',
                    ${amount},
                    ${description},
                    ${date || new Date()},
                    ${req.userData.userId}
                )
            `;

            // Toplam borcu güncelle
            await sql.query`
                UPDATE credit_book
                SET total_credit = total_credit + ${amount},
                    updated_at = GETDATE()
                WHERE id = ${credit_book_id}
            `;

            res.json({ 
                message: 'Borç başarıyla eklendi',
                amount: amount
            });
        } catch (error) {
            logger.error('Borç eklenirken hata:', error);
            res.status(500).json({ message: error.message });
        }
    },

    // Müşteri detaylarını getirme
    getCustomerDetails: async (req, res) => {
        try {
            const { id } = req.params;

            const customerResult = await sql.query`
                SELECT 
                    cb.*,
                    (
                        SELECT COUNT(*)
                        FROM credit_transactions
                        WHERE credit_book_id = cb.id
                    ) as transaction_count
                FROM credit_book cb
                WHERE cb.id = ${id}
            `;

            if (customerResult.recordset.length === 0) {
                return res.status(404).json({ message: 'Müşteri bulunamadı' });
            }

            const transactionsResult = await sql.query`
                SELECT 
                    ct.*,
                    u.username as created_by_user
                FROM credit_transactions ct
                LEFT JOIN users u ON ct.created_by = u.id
                WHERE ct.credit_book_id = ${id}
                ORDER BY ct.transaction_date DESC
            `;

            const customer = customerResult.recordset[0];
            customer.transactions = transactionsResult.recordset;

            res.json(customer);
        } catch (error) {
            logger.error('Müşteri detayları getirilirken hata:', error);
            res.status(500).json({ message: error.message });
        }
    },

    // Tüm veresiye müşterilerini listeleme
    getAllCustomers: async (req, res) => {
        try {
            const result = await sql.query`
                SELECT 
                    cb.*,
                    (
                        SELECT COUNT(*)
                        FROM credit_transactions
                        WHERE credit_book_id = cb.id
                    ) as transaction_count
                FROM credit_book cb
                WHERE cb.is_active = 1
                ORDER BY cb.customer_name
            `;

            res.json(result.recordset);
        } catch (error) {
            logger.error('Müşteriler listelenirken hata:', error);
            res.status(500).json({ message: error.message });
        }
    },

    // Müşteriyi silme (soft delete)
    deleteCustomer: async (req, res) => {
        try {
            const { id } = req.params;

            await sql.query`
                UPDATE credit_book
                SET is_active = 0,
                    updated_at = GETDATE()
                WHERE id = ${id}
            `;

            res.json({ message: 'Müşteri başarıyla silindi' });
        } catch (error) {
            logger.error('Müşteri silinirken hata:', error);
            res.status(500).json({ message: error.message });
        }
    },

    // Excel'e aktarma
    exportToExcel: async (req, res) => {
        try {
            const { id } = req.params; // Tek müşteri için
            
            // Müşteri ve işlem bilgilerini al
            const customerResult = await sql.query`
                SELECT * FROM credit_book WHERE id = ${id}
            `;

            const transactionsResult = await sql.query`
                SELECT 
                    ct.transaction_date,
                    ct.description,
                    ct.amount,
                    u.username as recorded_by
                FROM credit_transactions ct
                LEFT JOIN users u ON ct.created_by = u.id
                WHERE ct.credit_book_id = ${id}
                ORDER BY ct.transaction_date
            `;

            const customer = customerResult.recordset[0];
            const transactions = transactionsResult.recordset;

            // Excel dosyası oluştur
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Veresiye Detay');

            // Müşteri bilgileri
            worksheet.addRow(['MÜŞTERİ BİLGİLERİ']);
            worksheet.addRow(['Ad Soyad:', customer.customer_name]);
            worksheet.addRow(['Telefon:', customer.phone]);
            worksheet.addRow(['Adres:', customer.address]);
            worksheet.addRow(['Toplam Borç:', customer.total_credit]);
            worksheet.addRow([]);

            // İşlem detayları
            worksheet.addRow(['TARİH', 'AÇIKLAMA', 'TUTAR', 'KAYIT YAPAN']);
            
            transactions.forEach(transaction => {
                worksheet.addRow([
                    new Date(transaction.transaction_date).toLocaleDateString('tr-TR'),
                    transaction.description,
                    transaction.amount,
                    transaction.recorded_by
                ]);
            });

            // Stil ayarları
            worksheet.getRow(1).font = { bold: true };
            worksheet.getColumn(3).numFmt = '#,##0.00₺';
            worksheet.columns.forEach(column => {
                column.width = 15;
            });

            // Dosyayı kaydet
            const fileName = `veresiye_${customer.customer_name}_${Date.now()}.xlsx`;
            const filePath = path.join(__dirname, '../../uploads/excel', fileName);
            
            await workbook.xlsx.writeFile(filePath);

            res.download(filePath, fileName, (err) => {
                if (err) {
                    logger.error('Excel dosyası indirilirken hata:', err);
                    res.status(500).json({ message: 'Dosya indirilemedi' });
                }
                // Dosyayı sil
                fs.unlink(filePath, err => {
                    if (err) logger.error('Geçici dosya silinirken hata:', err);
                });
            });

        } catch (error) {
            logger.error('Excel export edilirken hata:', error);
            res.status(500).json({ message: error.message });
        }
    },

    // Tüm müşterileri Excel'e aktarma
    exportAllToExcel: async (req, res) => {
        try {
            const result = await sql.query`
                SELECT 
                    cb.customer_name,
                    cb.phone,
                    cb.address,
                    cb.total_credit,
                    cb.created_at
                FROM credit_book cb
                WHERE cb.is_active = 1
                ORDER BY cb.customer_name
            `;

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Tüm Veresiyeler');

            // Başlıklar
            worksheet.addRow(['MÜŞTERİ ADI', 'TELEFON', 'ADRES', 'TOPLAM BORÇ', 'KAYIT TARİHİ']);

            // Veriler
            result.recordset.forEach(customer => {
                worksheet.addRow([
                    customer.customer_name,
                    customer.phone,
                    customer.address,
                    customer.total_credit,
                    new Date(customer.created_at).toLocaleDateString('tr-TR')
                ]);
            });

            // Stil ayarları
            worksheet.getRow(1).font = { bold: true };
            worksheet.getColumn(4).numFmt = '#,##0.00₺';
            worksheet.columns.forEach(column => {
                column.width = 15;
            });

            // Dosyayı kaydet
            const fileName = `tum_veresiyeler_${Date.now()}.xlsx`;
            const filePath = path.join(__dirname, '../../uploads/excel', fileName);
            
            await workbook.xlsx.writeFile(filePath);

            res.download(filePath, fileName, (err) => {
                if (err) {
                    logger.error('Excel dosyası indirilirken hata:', err);
                    res.status(500).json({ message: 'Dosya indirilemedi' });
                }
                // Dosyayı sil
                fs.unlink(filePath, err => {
                    if (err) logger.error('Geçici dosya silinirken hata:', err);
                });
            });

        } catch (error) {
            logger.error('Excel export edilirken hata:', error);
            res.status(500).json({ message: error.message });
        }
    }
};

module.exports = creditBookController;