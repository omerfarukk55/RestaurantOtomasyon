// src/controllers/categoryController.js
const Category = require('../models/Category');
const { sql } = require('../../config/database');
const ResponseHandler = require('../utils/responseHandler');
const logger = require('../services/loggerService');

const categoryController = {
    addCategory: async (req, res) => {
        try {
            if (!Category.validateName(req.body.name)) {
                return ResponseHandler.error(res, 'Geçersiz kategori adı');
            }

            const categoryId = await Category.create(sql, req.body);
            logger.info(`Yeni kategori eklendi: ${req.body.name}`);

            return ResponseHandler.success(res, { categoryId }, 'Kategori başarıyla eklendi', 201);
        } catch (error) {
            logger.error('Kategori eklenirken hata:', error);
            return ResponseHandler.error(res, error.message);
        }
    },

    updateCategory: async (req, res) => {
        try {
            const { id } = req.params;
            const category = await Category.getById(sql, id);

            if (!category) {
                return ResponseHandler.error(res, 'Kategori bulunamadı', 404);
            }

            await Category.update(sql, id, req.body);
            logger.info(`Kategori güncellendi: ID ${id}`);

            return ResponseHandler.success(res, null, 'Kategori başarıyla güncellendi');
        } catch (error) {
            logger.error('Kategori güncellenirken hata:', error);
            return ResponseHandler.error(res, error.message);
        }
    },

    deleteCategory: async (req, res) => {
        try {
            await Category.delete(sql, req.params.id);
            logger.info(`Kategori silindi: ID ${req.params.id}`);

            return ResponseHandler.success(res, null, 'Kategori başarıyla silindi');
        } catch (error) {
            logger.error('Kategori silinirken hata:', error);
            return ResponseHandler.error(res, error.message);
        }
    },

    getAllCategoriesAdmin: async (req, res) => {
        try {
            const categories = await Category.getAll(sql);
            return ResponseHandler.success(res, categories);
        } catch (error) {
            logger.error('Kategoriler listelenirken hata:', error);
            return ResponseHandler.error(res, error.message);
        }
    },

    getActiveCategories: async (req, res) => {
        try {
            const categories = await Category.getActive(sql);
            return ResponseHandler.success(res, categories);
        } catch (error) {
            logger.error('Aktif kategoriler listelenirken hata:', error);
            return ResponseHandler.error(res, error.message);
        }
    },

    getCategoryById: async (req, res) => {
        try {
            const category = await Category.getById(sql, req.params.id, true);
            
            if (!category) {
                return ResponseHandler.error(res, 'Kategori bulunamadı', 404);
            }

            return ResponseHandler.success(res, category);
        } catch (error) {
            logger.error('Kategori detayı getirilirken hata:', error);
            return ResponseHandler.error(res, error.message);
        }
    },

    updateCategoryOrder: async (req, res) => {
        try {
            await Category.updateOrder(sql, req.body.orderData);
            logger.info('Kategori sıralaması güncellendi');

            return ResponseHandler.success(res, null, 'Kategori sıralaması güncellendi');
        } catch (error) {
            logger.error('Kategori sıralaması güncellenirken hata:', error);
            return ResponseHandler.error(res, error.message);
        }
    }
};

module.exports = categoryController;