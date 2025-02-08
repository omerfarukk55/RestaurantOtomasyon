// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { isAdmin } = require('../middleware/auth');
const { productUpload, processProductImage, handleUploadError } = require('../middleware/fileUpload');

// Admin rotaları
router.post('/', 
    isAdmin, 
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
    },
    productController.addProduct
);

router.put('/:id',
    isAdmin,
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
    },
    productController.updateProduct
);

// Hata yakalama
router.use(handleUploadError);

module.exports = router;