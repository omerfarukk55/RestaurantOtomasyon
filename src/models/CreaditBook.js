// src/models/CreditBook.js
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs').promises;

class CreditBook {
    constructor(data) {
        this.id = data.id;
        this.customer_name = data.customer_name;
        this.phone = data.phone;
        this.address = data.address;
        this.total_credit = data.total_credit || 0;
        this.notes = data.notes;
        this.is_active = data.is_active;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
        this.transaction_count = data.transaction_count;
        this.transactions = data.transactions || [];
    }

    static getTableName() {
        return 'credit_book';
    }

    static getTransactionsTableName() {
        return 'credit_transactions';
    }

    // Model metodları
    toJSON() {
        return {
            id: this.id,
            customer_name: this.customer_name,
            phone: this.phone,
            address: this.address,
            total_credit: this.total_credit,
            notes: this.notes,
            is_active: this.is_active,
            created_at: this.created_at,
            transaction_count: this.transaction_count,
            transactions: this.transactions
        };
    }

    // Statik metodlar
    static fromDB(data) {
        return new CreditBook(data);
    }

    // Validation metodları
    static validateCustomerName(name) {
        return name && name.trim().length >= 2;
    }

    static validatePhone(phone) {
        return !phone || /^\+?[\d\s-]+$/.test(phone);
    }

    static validateAmount(amount) {
        return amount && !isNaN(amount) && amount > 0;
    }

    // Database işlemleri
    static async create(sql, customerData) {
        try {
            const result = await sql.query`
                INSERT INTO ${this.getTableName()} (
                    customer_name,
                    phone,
                    address,
                    total_credit,
                    notes,
                    is_active,
                    created_at
                )
                VALUES (
                    ${customerData.customer_name},
                    ${customerData.phone},
                    ${customerData.address},
                    0,
                    ${customerData.notes},
                    1,
                    GETDATE()
                )
                SELECT SCOPE_IDENTITY() as id
            `;

            return result.recordset[0].id;
        } catch (error) {
            throw error;
        }
    }

    static async addDebt(sql, debtData) {
        const transaction = new sql.Transaction();
        try {
            await transaction.begin();

            // Borç işlemini kaydet
            await sql.query`
                INSERT INTO ${this.getTransactionsTableName()} (
                    credit_book_id,
                    transaction_type,
                    amount,
                    description,
                    transaction_date,
                    created_by
                )
                VALUES (
                    ${debtData.credit_book_id},
                    'debit',
                    ${debtData.amount},
                    ${debtData.description},
                    ${debtData.date || new Date()},
                    ${debtData.created_by}
                )
            `;

            // Toplam borcu güncelle
            await sql.query`
                UPDATE ${this.getTableName()}
                SET total_credit = total_credit + ${debtData.amount},
                    updated_at = GETDATE()
                WHERE id = ${debtData.credit_book_id}
            `;

            await transaction.commit();
            return debtData.amount;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    static async getById(sql, id) {
        try {
            const customerResult = await sql.query`
                SELECT 
                    cb.*,
                    (
                        SELECT COUNT(*)
                        FROM ${this.getTransactionsTableName()}
                        WHERE credit_book_id = cb.id
                    ) as transaction_count
                FROM ${this.getTableName()} cb
                WHERE cb.id = ${id}
            `;

            if (customerResult.recordset.length === 0) {
                return null;
            }

            const transactionsResult = await sql.query`
                SELECT 
                    ct.*,
                    u.username as created_by_user
                FROM ${this.getTransactionsTableName()} ct
                LEFT JOIN users u ON ct.created_by = u.id
                WHERE ct.credit_book_id = ${id}
                ORDER BY ct.transaction_date DESC
            `;

            const customer = customerResult.recordset[0];
            customer.transactions = transactionsResult.recordset;

            return this.fromDB(customer);
        } catch (error) {
            throw error;
        }
    }

    static async getAll(sql) {
        try {
            const result = await sql.query`
                SELECT 
                    cb.*,
                    (
                        SELECT COUNT(*)
                        FROM ${this.getTransactionsTableName()}
                        WHERE credit_book_id = cb.id
                    ) as transaction_count
                FROM ${this.getTableName()} cb
                WHERE cb.is_active = 1
                ORDER BY cb.customer_name
            `;

            return result.recordset.map(customer => this.fromDB(customer));
        } catch (error) {
            throw error;
        }
    }

    static async delete(sql, id) {
        try {
            await sql.query`
                UPDATE ${this.getTableName()}
                SET is_active = 0,
                    updated_at = GETDATE()
                WHERE id = ${id}
            `;
        } catch (error) {
            throw error;
        }
    }

    // Excel export işlemleri
    static async exportToExcel(sql, id) {
        try {
            const customer = await this.getById(sql, id);
            if (!customer) {
                throw new Error('Müşteri bulunamadı');
            }

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Veresiye Detay');

            // Excel formatını oluştur
            this.formatExcelWorksheet(worksheet, customer);

            const fileName = `veresiye_${customer.customer_name}_${Date.now()}.xlsx`;
            const filePath = path.join(__dirname, '../../uploads/excel', fileName);

            await workbook.xlsx.writeFile(filePath);
            return { filePath, fileName };
        } catch (error) {
            throw error;
        }
    }

    static async exportAllToExcel(sql) {
        try {
            const customers = await this.getAll(sql);
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Tüm Veresiyeler');

            // Excel formatını oluştur
            this.formatAllExcelWorksheet(worksheet, customers);

            const fileName = `tum_veresiyeler_${Date.now()}.xlsx`;
            const filePath = path.join(__dirname, '../../uploads/excel', fileName);

            await workbook.xlsx.writeFile(filePath);
            return { filePath, fileName };
        } catch (error) {
            throw error;
        }
    }

    // Excel yardımcı metodları
    static formatExcelWorksheet(worksheet, customer) {
        // Müşteri bilgileri
        worksheet.addRow(['MÜŞTERİ BİLGİLERİ']);
        worksheet.addRow(['Ad Soyad:', customer.customer_name]);
        worksheet.addRow(['Telefon:', customer.phone]);
        worksheet.addRow(['Adres:', customer.address]);
        worksheet.addRow(['Toplam Borç:', customer.total_credit]);
        worksheet.addRow([]);

        // İşlem detayları
        worksheet.addRow(['TARİH', 'AÇIKLAMA', 'TUTAR', 'KAYIT YAPAN']);

        customer.transactions.forEach(transaction => {
            worksheet.addRow([
                new Date(transaction.transaction_date).toLocaleDateString('tr-TR'),
                transaction.description,
                transaction.amount,
                transaction.created_by_user
            ]);
        });

        // Stil ayarları
        this.applyExcelStyles(worksheet);
    }

    static formatAllExcelWorksheet(worksheet, customers) {
        worksheet.addRow(['MÜŞTERİ ADI', 'TELEFON', 'ADRES', 'TOPLAM BORÇ', 'KAYIT TARİHİ']);

        customers.forEach(customer => {
            worksheet.addRow([
                customer.customer_name,
                customer.phone,
                customer.address,
                customer.total_credit,
                new Date(customer.created_at).toLocaleDateString('tr-TR')
            ]);
        });

        this.applyExcelStyles(worksheet);
    }

    static applyExcelStyles(worksheet) {
        worksheet.getRow(1).font = { bold: true };
        worksheet.getColumn(3).numFmt = '#,##0.00₺';
        worksheet.columns.forEach(column => {
            column.width = 15;
        });
    }
}

module.exports = CreditBook;