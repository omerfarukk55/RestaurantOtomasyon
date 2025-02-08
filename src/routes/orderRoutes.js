// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { hasRole } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validator');
const { body } = require('express-validator');

// Validation rules
const orderValidation = {
    create: [
        body('table_number').notEmpty().withMessage('Masa numarası gerekli'),
        body('items').isArray().withMessage('Sipariş kalemleri gerekli'),
        body('items.*.product_id').isInt().withMessage('Geçerli ürün ID gerekli'),
        body('items.*.quantity').isInt({ min: 1 }).withMessage('Geçerli miktar giriniz')
    ],
    updateStatus: [
        body('status')
            .isIn(['pending', 'preparing', 'ready', 'completed', 'cancelled'])
            .withMessage('Geçerli bir sipariş durumu giriniz')
    ]
};

// Routes
router.post('/', [hasRole(['waiter']), orderValidation.create, validateRequest], orderController.createOrder);
router.put('/:id/status', [hasRole(['cashier']), orderValidation.updateStatus, validateRequest], orderController.updateOrderStatus);
router.get('/table/:table_number', hasRole(['waiter', 'cashier']), orderController.getActiveOrdersByTable);
router.get('/daily', hasRole(['admin', 'cashier']), orderController.getDailyOrders);
router.get('/:id', hasRole(['admin', 'cashier', 'waiter']), orderController.getOrderDetails);

module.exports = router;