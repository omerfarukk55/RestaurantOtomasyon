const { body, validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

const productValidationRules = [
    body('name').notEmpty().trim().withMessage('Ürün adı gerekli'),
    body('price').isFloat({ min: 0 }).withMessage('Geçerli bir fiyat giriniz'),
    body('category_id').isInt().withMessage('Geçerli bir kategori seçiniz')
];

const categoryValidationRules = [
    body('name').notEmpty().trim().withMessage('Kategori adı gerekli')
];

const orderValidationRules = [
    body('items').isArray().withMessage('Sipariş öğeleri gerekli'),
    body('items.*.product_id').isInt().withMessage('Geçerli ürün ID\'si gerekli'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Geçerli miktar giriniz')
];

module.exports = {
    validateRequest,
    productValidationRules,
    categoryValidationRules,
    orderValidationRules
};