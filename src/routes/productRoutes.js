// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { isAdmin, hasRole } = require('../middleware/auth');
const { productUpload, processProductImage, handleUploadError } = require('../middleware/fileUpload');
const { validateRequest } = require('../middleware/validator');
const { body } = require('express-validator');

// Validation rules
const productValidation = {
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

// Admin rotaları (Ürün yönetimi)
router.post('/', [
    isAdmin,
    productValidation.create,
    validateRequest,
    productUpload.single('image'),
    async (req, res, next) => {
        try {
            if (req.file) {
                req.body.image_url = await processProductImage(req.file);
            }
            next();
        } catch (error) {
            next(error);
        }
    }
], productController.addProduct);

router.put('/:id', [
    isAdmin,
    productValidation.update,
    validateRequest,
    productUpload.single('image'),
    async (req, res, next) => {
        try {
            if (req.file) {
                req.body.image_url = await processProductImage(req.file);
            }
            next();
        } catch (error) {
            next(error);
        }
    }
], productController.updateProduct);

router.delete('/:id', isAdmin, productController.deleteProduct);

// Garson ve Kasiyer rotaları (Ürün görüntüleme)
router.get('/', hasRole(['admin', 'cashier', 'waiter']), productController.getActiveProducts);
router.get('/category/:categoryId', hasRole(['admin', 'cashier', 'waiter']), productController.getProductsByCategory);
router.get('/:id', hasRole(['admin', 'cashier', 'waiter']), productController.getProductDetails);

// Hata yakalama
router.use(handleUploadError);

module.exports = router;