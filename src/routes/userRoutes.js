// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isAuth, isAdmin } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validator');
const { body, param } = require('express-validator');

// Validation rules
const userValidation = {
    create: [
        body('username')
            .notEmpty().withMessage('Kullanıcı adı gerekli')
            .trim()
            .isLength({ min: 3 }).withMessage('Kullanıcı adı en az 3 karakter olmalı')
            .matches(/^[a-zA-Z0-9_]+$/).withMessage('Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir'),
        body('password')
            .isLength({ min: 6 }).withMessage('Şifre en az 6 karakter olmalı')
            .matches(/\d/).withMessage('Şifre en az bir rakam içermeli'),
        body('full_name')
            .notEmpty().withMessage('Ad soyad gerekli')
            .trim()
            .isLength({ min: 3 }).withMessage('Ad soyad en az 3 karakter olmalı'),
        body('role')
            .isIn(['cashier', 'waiter']).withMessage('Geçerli bir rol seçin: kasiyer veya garson'),
        body('phone')
            .optional()
            .matches(/^\+?[\d\s-]+$/).withMessage('Geçerli bir telefon numarası girin')
    ],
    update: [
        param('id').isInt().withMessage('Geçerli bir personel ID\'si gerekli'),
        body('full_name')
            .optional()
            .trim()
            .isLength({ min: 3 }).withMessage('Ad soyad en az 3 karakter olmalı'),
        body('role')
            .optional()
            .isIn(['cashier', 'waiter']).withMessage('Geçerli bir rol seçin: kasiyer veya garson'),
        body('phone')
            .optional()
            .matches(/^\+?[\d\s-]+$/).withMessage('Geçerli bir telefon numarası girin'),
        body('is_active')
            .optional()
            .isBoolean().withMessage('Geçerli bir aktiflik durumu seçin')
    ],
    getById: [
        param('id').isInt().withMessage('Geçerli bir personel ID\'si gerekli')
    ]
};

// Routes
// Admin routes
router.post('/staff', 
    [
        isAdmin, 
        userValidation.create, 
        validateRequest
    ], 
    userController.createUser
);

router.get('/staff', 
    isAdmin, 
    userController.getAllStaff
);

router.get('/staff/:id', 
    [
        isAdmin,
        userValidation.getById,
        validateRequest
    ], 
    userController.getStaffDetails
);

router.get('/staff/:id/performance', 
    [
        isAdmin,
        userValidation.getById,
        validateRequest
    ], 
    userController.getStaffPerformance
);

router.put('/staff/:id', 
    [
        isAdmin, 
        userValidation.update, 
        validateRequest
    ], 
    userController.updateUser
);

// Personel silme (soft delete)
router.delete('/staff/:id',
    [
        isAdmin,
        userValidation.getById,
        validateRequest
    ],
    userController.deleteStaff
);

// Personel şifre sıfırlama (Admin için)
router.post('/staff/:id/reset-password',
    [
        isAdmin,
        userValidation.getById,
        validateRequest
    ],
    userController.resetStaffPassword
);

module.exports = router;