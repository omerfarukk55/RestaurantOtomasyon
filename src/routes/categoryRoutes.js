// routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { isAdmin } = require('../middleware/auth');
const { categoryUpload, processCategoryImage, handleUploadError } = require('../middleware/fileUpload');
const { validateRequest } = require('../middleware/validator');
const { body } = require('express-validator');

// Validation rules
const categoryValidation = {
    create: [
        body('name').notEmpty().trim().withMessage('Kategori adı gerekli'),
        body('display_order').optional().isInt({ min: 0 }).withMessage('Geçerli bir sıralama numarası girin')
    ],
    update: [
        body('name').optional().trim().notEmpty().withMessage('Kategori adı boş olamaz'),
        body('display_order').optional().isInt({ min: 0 }).withMessage('Geçerli bir sıralama numarası girin'),
        body('is_active').optional().isBoolean().withMessage('Geçerli bir durum seçin')
    ]
};

// Admin rotaları
router.post('/', [
    isAdmin,
    categoryValidation.create,
    validateRequest,
    categoryUpload.single('image'),
    async (req, res, next) => {
        try {
            if (req.file) {
                req.body.image_url = await processCategoryImage(req.file);
            }
            next();
        } catch (error) {
            next(error);
        }
    }
], categoryController.addCategory);

router.put('/:id', [
    isAdmin,
    categoryValidation.update,
    validateRequest,
    categoryUpload.single('image'),
    async (req, res, next) => {
        try {
            if (req.file) {
                req.body.image_url = await processCategoryImage(req.file);
            }
            next();
        } catch (error) {
            next(error);
        }
    }
], categoryController.updateCategory);

router.delete('/:id', isAdmin, categoryController.deleteCategory);
router.get('/admin', isAdmin, categoryController.getAllCategoriesAdmin);
router.put('/order', isAdmin, categoryController.updateCategoryOrder);

// Genel rotalar
router.get('/', categoryController.getActiveCategories);
router.get('/:id', categoryController.getCategoryById);

// Hata yakalama
router.use(handleUploadError);

module.exports = router;