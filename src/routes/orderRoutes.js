// src/routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { isAuth, isAdmin } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validator');
const { body } = require('express-validator');

// Validation rules
const orderValidation = [
    body('table_number').notEmpty().withMessage('Masa numarası gerekli'),
    body('items').isArray().withMessage('Sipariş kalemleri gerekli'),
    body('items.*.product_id').isInt().withMessage('Geçerli ürün ID gerekli'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Geçerli miktar giriniz')
];

// Routes
router.post('/', [isAuth, orderValidation, validateRequest], orderController.createOrder);
router.put('/:id/status', isAdmin, orderController.updateOrderStatus);
router.get('/', isAdmin, orderController.getAllOrders);
router.get('/daily', isAdmin, orderController.getDailyOrders);
router.get('/table/:table_number', isAuth, orderController.getActiveOrdersByTable);
router.get('/:id', isAuth, orderController.getOrderDetails);

module.exports = router;