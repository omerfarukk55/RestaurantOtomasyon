// middleware/fileUpload.js

const multer = require('multer');
const path = require('path');

// Ürün resimleri için storage ve upload configuration
const productStorage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/products/');
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const productUpload = multer({
    storage: productStorage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Sadece resim dosyaları yüklenebilir!'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB - ürün resimleri için daha büyük boyut
    }
});

// Kategori resimleri için storage ve upload configuration
const categoryStorage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/categories/');
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'category-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const categoryUpload = multer({
    storage: categoryStorage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Sadece resim dosyaları yüklenebilir!'), false);
        }
    },
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB - kategori resimleri için daha küçük boyut
    }
});

// Resim işleme fonksiyonları
const processProductImage = async (file) => {
    try {
        // Ürün resmi için özel işlemler (boyut küçültme, watermark ekleme vb.)
        // Sharp veya başka bir resim işleme kütüphanesi kullanılabilir
        return file.path;
    } catch (error) {
        throw new Error('Resim işlenirken hata oluştu');
    }
};

const processCategoryImage = async (file) => {
    try {
        // Kategori resmi için özel işlemler
        return file.path;
    } catch (error) {
        throw new Error('Resim işlenirken hata oluştu');
    }
};

// Hata yakalama middleware'i
const handleUploadError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                message: 'Dosya boyutu çok büyük'
            });
        }
    }
    next(error);
};

module.exports = {
    productUpload,
    categoryUpload,
    processProductImage,
    processCategoryImage,
    handleUploadError
};