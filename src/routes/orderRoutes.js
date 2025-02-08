// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { hasRole, isAdmin } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validator');
const { body } = require('express-validator');

// Validation rules
const orderValidation = {
    create: [
        body('table_number').notEmpty().withMessage('Masa numarası gerekli'),
        body('items').isArray().withMessage('Sipariş kalemleri gerekli'),
        body('items.*.product_id').isInt().withMessage('Geçerli ürün ID gerekli'),
        body('items.*.quantity').isInt({ min: 1 }).withMessage('Geçerli miktar giriniz'),
        body('items.*.notes').optional().trim()
    ],
    updateStatus: [
        body('status').isIn(['pending', 'preparing', 'ready', 'completed', 'cancelled'])
            .withMessage('Geçerli bir sipariş durumu giriniz')
    ]
};

// Garson rotaları
router.post('/', [
    hasRole(['waiter']),
    orderValidation.create,
    validateRequest
], orderController.createOrder);

router.get('/my-tables', hasRole(['waiter']), orderController.getWaiterTables);
router.get('/table/:table_number', hasRole(['waiter']), orderController.getTableOrders);

// Kasiyer rotaları
router.get('/active', hasRole(['cashier']), orderController.getActiveOrders);
router.put('/:id/status', [
    hasRole(['cashier']),
    orderValidation.updateStatus,
    validateRequest
], orderController.updateOrderStatus);

// Admin rotaları
router.get('/daily-report', isAdmin, orderController.getDailyReport);
router.get('/monthly-report', isAdmin, orderController.getMonthlyReport);
router.get('/waiter-performance', isAdmin, orderController.getWaiterPerformance);

// Ortak rotalar
router.get('/:id', hasRole(['admin', 'cashier', 'waiter']), orderController.getOrderDetails);
router.get('/kitchen-display', hasRole(['admin', 'cashier', 'waiter']), orderController.getKitchenDisplay);

module.exports = router;