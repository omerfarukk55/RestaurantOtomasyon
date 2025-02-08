// routes/creditBookRoutes.js
const express = require('express');
const router = express.Router();
const creditBookController = require('../controllers/creditBookController');
const { isAdmin } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validator');
const { body } = require('express-validator');

// Validasyon kuralları
const creditBookValidation = [
    body('customer_name').notEmpty().trim().withMessage('Müşteri adı gerekli'),
    body('phone').optional().matches(/^\+?[\d\s-]+$/).withMessage('Geçerli bir telefon numarası giriniz')
];

const debtValidation = [
    body('amount').isFloat({ min: 0.01 }).withMessage('Geçerli bir tutar giriniz'),
    body('credit_book_id').isInt().withMessage('Geçerli bir müşteri seçiniz')
];

// Routes
router.post('/customers', [isAdmin, creditBookValidation, validateRequest], creditBookController.addCustomer);
router.post('/debt', [isAdmin, debtValidation, validateRequest], creditBookController.addDebt);
router.get('/customers', isAdmin, creditBookController.getAllCustomers);
router.get('/customers/:id', isAdmin, creditBookController.getCustomerDetails);
router.delete('/customers/:id', isAdmin, creditBookController.deleteCustomer);

// Excel export routes
router.get('/export/:id', isAdmin, creditBookController.exportToExcel);
router.get('/export-all', isAdmin, creditBookController.exportAllToExcel);

module.exports = router;