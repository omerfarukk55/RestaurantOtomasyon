// src/utils/validation.js
const { body, param, query } = require('express-validator');

const ROLES = ['cashier', 'waiter'];
const ORDER_STATUSES = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];

class ValidationRules {
    /**
     * Auth validasyonları
     */
    static auth = {
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
                .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
                .withMessage('Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermeli')
        ]
    };

    /**
     * Kullanıcı validasyonları
     */
    static user = {
        create: [
            body('username')
                .notEmpty()
                .trim()
                .withMessage('Kullanıcı adı gerekli')
                .isLength({ min: 3 })
                .withMessage('Kullanıcı adı en az 3 karakter olmalı'),
            body('password')
                .isLength({ min: 6 })
                .withMessage('Şifre en az 6 karakter olmalı'),
            body('full_name')
                .notEmpty()
                .trim()
                .withMessage('Ad soyad gerekli'),
            body('role')
                .isIn(ROLES)
                .withMessage('Geçerli bir rol seçin'),
            body('phone')
                .optional()
                .matches(/^\+?[\d\s-]+$/)
                .withMessage('Geçerli bir telefon numarası girin')
        ],

        update: [
            body('full_name')
                .optional()
                .trim()
                .notEmpty()
                .withMessage('Ad soyad boş olamaz'),
            body('role')
                .optional()
                .isIn(ROLES)
                .withMessage('Geçerli bir rol seçin'),
            body('phone')
                .optional()
                .matches(/^\+?[\d\s-]+$/)
                .withMessage('Geçerli bir telefon numarası girin'),
            body('is_active')
                .optional()
                .isBoolean()
                .withMessage('Geçerli bir aktiflik durumu seçin')
        ]
    };

    /**
     * Ürün validasyonları
     */
    static product = {
        create: [
            body('name')
                .notEmpty()
                .trim()
                .withMessage('Ürün adı gerekli'),
            body('price')
                .isFloat({ min: 0 })
                .withMessage('Geçerli bir fiyat girin'),
            body('category_id')
                .isInt()
                .withMessage('Geçerli bir kategori seçin'),
            body('description')
                .optional()
                .trim(),
            body('is_available')
                .optional()
                .isBoolean()
                .withMessage('Geçerli bir durum seçin')
        ],

        update: [
            param('id')
                .isInt()
                .withMessage('Geçerli bir ürün ID\'si gerekli'),
            body('name')
                .optional()
                .trim()
                .notEmpty()
                .withMessage('Ürün adı boş olamaz'),
            body('price')
                .optional()
                .isFloat({ min: 0 })
                .withMessage('Geçerli bir fiyat girin')
        ]
    };

    /**
     * Sipariş validasyonları
     */
    static order = {
        create: [
            body('table_number')
                .notEmpty()
                .withMessage('Masa numarası gerekli'),
            body('items')
                .isArray({ min: 1 })
                .withMessage('En az bir ürün seçilmeli'),
            body('items.*.product_id')
                .isInt()
                .withMessage('Geçerli ürün ID\'si gerekli'),
            body('items.*.quantity')
                .isInt({ min: 1 })
                .withMessage('Geçerli miktar giriniz'),
            body('items.*.notes')
                .optional()
                .trim()
        ],

        updateStatus: [
            param('id')
                .isInt()
                .withMessage('Geçerli bir sipariş ID\'si gerekli'),
            body('status')
                .isIn(ORDER_STATUSES)
                .withMessage('Geçerli bir sipariş durumu seçin')
        ],

        list: [
            query('startDate')
                .optional()
                .isDate()
                .withMessage('Geçerli bir başlangıç tarihi girin'),
            query('endDate')
                .optional()
                .isDate()
                .withMessage('Geçerli bir bitiş tarihi girin'),
            query('status')
                .optional()
                .isIn(ORDER_STATUSES)
                .withMessage('Geçerli bir sipariş durumu seçin')
        ]
    };

    /**
     * Kategori validasyonları
     */
    static category = {
        create: [
            body('name')
                .notEmpty()
                .trim()
                .withMessage('Kategori adı gerekli'),
            body('description')
                .optional()
                .trim(),
            body('display_order')
                .optional()
                .isInt({ min: 0 })
                .withMessage('Geçerli bir sıralama numarası girin')
        ],

        update: [
            param('id')
                .isInt()
                .withMessage('Geçerli bir kategori ID\'si gerekli'),
            body('name')
                .optional()
                .trim()
                .notEmpty()
                .withMessage('Kategori adı boş olamaz')
        ]
    };

    /**
     * Validasyon sonuçlarını kontrol etme
     */
    static validate(req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: 'error',
                message: 'Validasyon hatası',
                errors: errors.array()
            });
        }
        next();
    }

    /**
     * Custom validasyon kuralları
     */
    static custom = {
        isValidDate: (value) => {
            if (!value) return true;
            const date = new Date(value);
            return !isNaN(date.getTime());
        },

        isValidPhoneNumber: (value) => {
            if (!value) return true;
            return /^\+?[\d\s-]+$/.test(value);
        },

        isValidPrice: (value) => {
            if (!value) return true;
            return !isNaN(value) && parseFloat(value) >= 0;
        }
    };
}

module.exports = ValidationRules;