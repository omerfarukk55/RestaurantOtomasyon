// src/controllers/productController.js
const Product = require('../models/Product');
const { sql } = require('../../config/database');
const ResponseHandler = require('../utils/responseHandler');
const logger = require('../services/loggerService');

const productController = {
    addProduct: async (req, res) => {
        try {
            if (!Product.validateName(req.body.name)) {
                return ResponseHandler.error(res, 'Geçersiz ürün adı');
            }

            if (!Product.validatePrice(req.body.price)) {
                return ResponseHandler.error(res, 'Geçersiz fiyat');
            }

            if (!Product.validateCategoryId(req.body.category_id)) {
                return ResponseHandler.error(res, 'Geçersiz kategori');
            }

            const productId = await Product.create(sql, req.body);
            logger.info(`Yeni ürün eklendi: ${req.body.name}`);

            return ResponseHandler.success(res, { productId }, 'Ürün başarıyla eklendi', 201);
        } catch (error) {
            logger.error('Ürün eklenirken hata:', error);
            return ResponseHandler.error(res, error.message);
        }
    },

    updateProduct: async (req, res) => {
        try {
            const { id } = req.params;
            const product = await Product.getById(sql, id);

            if (!product) {
                return ResponseHandler.error(res, 'Ürün bulunamadı', 404);
            }

            await Product.update(sql, id, req.body);
            logger.info(`Ürün güncellendi: ID ${id}`);

            return ResponseHandler.success(res, { id }, 'Ürün başarıyla güncellendi');
        } catch (error) {
            logger.error('Ürün güncellenirken hata:', error);
            return ResponseHandler.error(res, error.message);
        }
    },

    deleteProduct: async (req, res) => {
        try {
            const { id } = req.params;
            await Product.delete(sql, id);
            logger.info(`Ürün silindi: ID ${id}`);

            return ResponseHandler.success(res, null, 'Ürün başarıyla silindi');
        } catch (error) {
            logger.error('Ürün silinirken hata:', error);
            return ResponseHandler.error(res, error.message);
        }
    },

    getAllProductsAdmin: async (req, res) => {
        try {
            const products = await Product.getAll(sql);
            return ResponseHandler.success(res, products);
        } catch (error) {
            logger.error('Ürünler listelenirken hata:', error);
            return ResponseHandler.error(res, error.message);
        }
    },

    getActiveProducts: async (req, res) => {
        try {
            const products = await Product.getAllActive(sql);
            return ResponseHandler.success(res, products);
        } catch (error) {
            logger.error('Aktif ürünler listelenirken hata:', error);
            return ResponseHandler.error(res, error.message);
        }
    },

    getProductById: async (req, res) => {
        try {
            const product = await Product.getById(sql, req.params.id);
            
            if (!product) {
                return ResponseHandler.error(res, 'Ürün bulunamadı', 404);
            }

            return ResponseHandler.success(res, product);
        } catch (error) {
            logger.error('Ürün detayı getirilirken hata:', error);
            return ResponseHandler.error(res, error.message);
        }
    },

    getProductsByCategory: async (req, res) => {
        try {
            const products = await Product.getByCategory(sql, req.params.categoryId);
            return ResponseHandler.success(res, products);
        } catch (error) {
            logger.error('Kategori ürünleri listelenirken hata:', error);
            return ResponseHandler.error(res, error.message);
        }
    }
};

module.exports = productController;