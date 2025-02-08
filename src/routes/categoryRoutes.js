// routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { isAdmin } = require('../middleware/auth');
const { categoryUpload, processCategoryImage, handleUploadError } = require('../middleware/fileUpload');

// Admin rotaları
router.post('/',
    isAdmin,
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
    },
    categoryController.addCategory
);

router.put('/:id',
    isAdmin,
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
    },
    categoryController.updateCategory
);

// Hata yakalama
router.use(handleUploadError);

module.exports = router;