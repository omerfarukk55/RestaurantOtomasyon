// src/controllers/orderController.js
const Order = require('../models/Order');
const { sql } = require('../../config/database');
const logger = require('../services/loggerService');
const ResponseHandler = require('../utils/responseHandler');

const orderController = {
    createOrder: async (req, res) => {
        try {
            const { table_number, items } = req.body;

            // Validasyonlar
            if (!Order.validateTableNumber(table_number)) {
                return ResponseHandler.error(res, 'Geçersiz masa numarası');
            }

            if (!Order.validateItems(items)) {
                return ResponseHandler.error(res, 'Geçersiz sipariş kalemleri');
            }

            const result = await Order.create(sql, { table_number, items });
            
            return ResponseHandler.success(
                res, 
                result,
                'Sipariş başarıyla oluşturuldu',
                201
            );
        } catch (error) {
            logger.error('Sipariş oluşturulurken hata:', error);
            return ResponseHandler.error(res, error.message);
        }
    },

    updateOrderStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            await Order.updateStatus(sql, id, status);
            return ResponseHandler.success(res, { id, status }, 'Sipariş durumu güncellendi');
        } catch (error) {
            logger.error('Sipariş güncellenirken hata:', error);
            return ResponseHandler.error(res, error.message);
        }
    },

    getOrderDetails: async (req, res) => {
        try {
            const order = await Order.getById(sql, req.params.id);
            
            if (!order) {
                return ResponseHandler.error(res, 'Sipariş bulunamadı', 404);
            }

            return ResponseHandler.success(res, order);
        } catch (error) {
            logger.error('Sipariş detayı getirilirken hata:', error);
            return ResponseHandler.error(res, error.message);
        }
    },

    getActiveOrdersByTable: async (req, res) => {
        try {
            const orders = await Order.getActiveByTable(sql, req.params.table_number);
            return ResponseHandler.success(res, orders);
        } catch (error) {
            logger.error('Masa siparişleri getirilirken hata:', error);
            return ResponseHandler.error(res, error.message);
        }
    },

    getDailyOrders: async (req, res) => {
        try {
            const result = await Order.getDailyOrders(sql, req.query.date);
            return ResponseHandler.success(res, result);
        } catch (error) {
            logger.error('Günlük rapor oluşturulurken hata:', error);
            return ResponseHandler.error(res, error.message);
        }
    }
};

module.exports = orderController;