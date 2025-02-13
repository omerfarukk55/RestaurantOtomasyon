// controllers/creditBookController.js
const CreditBook = require('../models/CreaditBook');
const { sql } = require('../../config/database');
const ResponseHandler = require('../utils/responseHandler');
const logger = require('../services/loggerService');
const fs = require('fs').promises;

const creditBookController = {
    addCustomer: async (req, res) => {
        try {
            if (!CreditBook.validateCustomerName(req.body.customer_name)) {
                return ResponseHandler.error(res, 'Geçersiz müşteri adı');
            }

            if (!CreditBook.validatePhone(req.body.phone)) {
                return ResponseHandler.error(res, 'Geçersiz telefon numarası');
            }

            const customerId = await CreditBook.create(sql, req.body);
            logger.info(`Yeni veresiye müşterisi eklendi: ${req.body.customer_name}`);

            return ResponseHandler.success(res, { customerId }, 'Veresiye müşterisi başarıyla eklendi', 201);
        } catch (error) {
            logger.error('Veresiye müşterisi eklenirken hata:', error);
            return ResponseHandler.error(res, error.message);
        }
    },

    addDebt: async (req, res) => {
        try {
            if (!CreditBook.validateAmount(req.body.amount)) {
                return ResponseHandler.error(res, 'Geçersiz tutar');
            }

            const debtData = {
                ...req.body,
                created_by: req.userData.userId
            };

            const amount = await CreditBook.addDebt(sql, debtData);
            logger.info(`Borç eklendi: ${amount} TL, Müşteri ID: ${req.body.credit_book_id}`);

            return ResponseHandler.success(res, { amount }, 'Borç başarıyla eklendi');
        } catch (error) {
            logger.error('Borç eklenirken hata:', error);
            return ResponseHandler.error(res, error.message);
        }
    },

    getCustomerDetails: async (req, res) => {
        try {
            const customer = await CreditBook.getById(sql, req.params.id);
            
            if (!customer) {
                return ResponseHandler.error(res, 'Müşteri bulunamadı', 404);
            }

            return ResponseHandler.success(res, customer);
        } catch (error) {
            logger.error('Müşteri detayları getirilirken hata:', error);
            return ResponseHandler.error(res, error.message);
        }
    },
    getAllCredits: async (req, res) => {
        try {
            const credits = await CreditBook.find();
            res.status(200).json(credits);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    createCredit: async (req, res) => {
        try {
            const newCredit = new CreditBook(req.body);
            await newCredit.save();
            res.status(201).json(newCredit);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    getAllCustomers: async (req, res) => {
        try {
            const customers = await CreditBook.getAll(sql);
            return ResponseHandler.success(res, customers);
        } catch (error) {
            logger.error('Müşteriler listelenirken hata:', error);
            return ResponseHandler.error(res, error.message);
        }
    },

    deleteCustomer: async (req, res) => {
        try {
            await CreditBook.delete(sql, req.params.id);
            logger.info(`Müşteri silindi: ID ${req.params.id}`);

            return ResponseHandler.success(res, null, 'Müşteri başarıyla silindi');
        } catch (error) {
            logger.error('Müşteri silinirken hata:', error);
            return ResponseHandler.error(res, error.message);
        }
    },

    exportToExcel: async (req, res) => {
        try {
            const { filePath, fileName } = await CreditBook.exportToExcel(sql, req.params.id);

            res.download(filePath, fileName, async (err) => {
                if (err) {
                    logger.error('Excel dosyası indirilirken hata:', err);
                    return ResponseHandler.error(res, 'Dosya indirilemedi', 500);
                }
                try {
                    await fs.unlink(filePath);
                } catch (unlinkError) {
                    logger.error('Geçici dosya silinirken hata:', unlinkError);
                }
            });
        } catch (error) {
            logger.error('Excel export edilirken hata:', error);
            return ResponseHandler.error(res, error.message);
        }
    },

    exportAllToExcel: async (req, res) => {
        try {
            const { filePath, fileName } = await CreditBook.exportAllToExcel(sql);

            res.download(filePath, fileName, async (err) => {
                if (err) {
                    logger.error('Excel dosyası indirilirken hata:', err);
                    return ResponseHandler.error(res, 'Dosya indirilemedi', 500);
                }
                try {
                    await fs.unlink(filePath);
                } catch (unlinkError) {
                    logger.error('Geçici dosya silinirken hata:', unlinkError);
                }
            });
        } catch (error) {
            logger.error('Excel export edilirken hata:', error);
            return ResponseHandler.error(res, error.message);
        }
    }
};

module.exports = creditBookController;