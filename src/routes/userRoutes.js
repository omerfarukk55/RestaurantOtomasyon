// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isAuth, isAdmin } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validator');
const { body } = require('express-validator');

// Validation rules
const userValidation = {
    create: [
        body('username').notEmpty().trim().withMessage('Kullanıcı adı gerekli'),
        body('password').isLength({ min: 6 }).withMessage('Şifre en az 6 karakter olmalı'),
        body('full_name').notEmpty().trim().withMessage('Ad soyad gerekli'),
        body('role').isIn(['cashier', 'waiter']).withMessage('Geçerli bir rol seçin: kasiyer veya garson'),
        body('phone').optional().matches(/^\+?[\d\s-]+$/).withMessage('Geçerli bir telefon numarası girin')
    ],
    update: [
        body('full_name').optional().trim(),
        body('role').optional().isIn(['cashier', 'waiter']),
        body('phone').optional().matches(/^\+?[\d\s-]+$/),
        body('is_active').optional().isBoolean()
    ]
};

// Routes
// Admin routes
router.post('/staff', [isAdmin, userValidation.create, validateRequest], userController.createUser);
router.get('/staff', isAdmin, userController.getAllStaff);
router.get('/staff/:id', isAdmin, userController.getStaffDetails);
router.get('/staff/:id/performance', isAdmin, userController.getStaffPerformance);
router.put('/staff/:id', [isAdmin, userValidation.update, validateRequest], userController.updateUser);

module.exports = router;