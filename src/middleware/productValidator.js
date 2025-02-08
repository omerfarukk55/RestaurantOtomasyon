const { body } = require('express-validator');

exports.productValidationRules = {
    create: [
        body('name').notEmpty().trim().withMessage('Ürün adı gerekli'),
        body('price').isFloat({ min: 0 }).withMessage('Geçerli bir fiyat giriniz'),
        body('category_id').isInt().withMessage('Geçerli bir kategori seçiniz'),
        body('description').optional().trim()
    ],
    update: [
        body('name').optional().trim(),
        body('price').optional().isFloat({ min: 0 }),
        body('category_id').optional().isInt(),
        body('is_available').optional().isBoolean()
    ]
};