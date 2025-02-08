// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRequest } = require('../middleware/validator');
const { body } = require('express-validator');
const { isAdmin, hasRole } = require('../middleware/auth');

// Validation rules
const authValidation = {
    login: [
        body('username')
            .notEmpty()
            .trim()
            .withMessage('Kullanıcı adı gerekli'),
        body('password')
            .notEmpty()
            .withMessage('Şifre gerekli')
    ],
    changePassword: [
        body('currentPassword')
            .notEmpty()
            .withMessage('Mevcut şifre gerekli'),
        body('newPassword')
            .isLength({ min: 6 })
            .withMessage('Yeni şifre en az 6 karakter olmalı')
    ]
};

// Public routes
router.post('/login', [
    authValidation.login,
    validateRequest
], authController.login);

// Protected routes
router.post('/logout', hasRole(['admin', 'cashier', 'waiter']), authController.logout);

router.post('/change-password', [
    hasRole(['admin', 'cashier', 'waiter']),
    authValidation.changePassword,
    validateRequest
], authController.changePassword);

// Admin routes
router.post('/reset-password/:userId', isAdmin, authController.resetPassword);

// Session check
router.get('/check-session', hasRole(['admin', 'cashier', 'waiter']), authController.checkSession);

module.exports = router;