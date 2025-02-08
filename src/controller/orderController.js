// src/controllers/orderController.js
const { sql } = require('../../config/database');
const logger = require('../services/loggerService');
const ResponseHandler = require('../utils/responseHandler');

const orderController = {
    // Yeni sipariş oluşturma
    createOrder: async (req, res) => {
        const transaction = new sql.Transaction();
        try {
            const {
                table_number,
                items // [{product_id, quantity}]
            } = req.body;

            await transaction.begin();

            // Sipariş başlığı oluştur
            const orderResult = await sql.query`
                INSERT INTO orders (
                    table_number,
                    status,
                    total_amount,
                    created_at
                )
                VALUES (
                    ${table_number},
                    'pending',
                    0,
                    GETDATE()
                )
                SELECT SCOPE_IDENTITY() as id
            `;
            
            const orderId = orderResult.recordset[0].id;
            let totalAmount = 0;

            // Sipariş detaylarını ekle
            for (const item of items) {
                // Ürün bilgilerini al
                const productResult = await sql.query`
                    SELECT price, name 
                    FROM products 
                    WHERE id = ${item.product_id} AND is_available = 1
                `;

                if (productResult.recordset.length === 0) {
                    throw new Error(`Ürün bulunamadı: ${item.product_id}`);
                }

                const product = productResult.recordset[0];
                const itemTotal = product.price * item.quantity;
                totalAmount += itemTotal;

                // Sipariş detayını ekle
                await sql.query`
                    INSERT INTO order_items (
                        order_id,
                        product_id,
                        quantity,
                        unit_price,
                        total_price
                    )
                    VALUES (
                        ${orderId},
                        ${item.product_id},
                        ${item.quantity},
                        ${product.price},
                        ${itemTotal}
                    )
                `;
            }

            // Sipariş toplamını güncelle
            await sql.query`
                UPDATE orders 
                SET total_amount = ${totalAmount}
                WHERE id = ${orderId}
            `;

            await transaction.commit();

            return ResponseHandler.success(res, {
                orderId,
                totalAmount,
                message: 'Sipariş başarıyla oluşturuldu'
            }, 'Sipariş oluşturuldu', 201);

        } catch (error) {
            await transaction.rollback();
            logger.error('Sipariş oluşturulurken hata:', error);
            return ResponseHandler.error(res, error.message);
        }
    },

    // Siparişi güncelleme (Sadece durum güncellemesi)
    updateOrderStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            // Geçerli durumlar
            const validStatuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];
            if (!validStatuses.includes(status)) {
                return ResponseHandler.error(res, 'Geçersiz sipariş durumu', 400);
            }

            await sql.query`
                UPDATE orders 
                SET status = ${status}
                WHERE id = ${id}
            `;

            return ResponseHandler.success(res, { id, status }, 'Sipariş durumu güncellendi');

        } catch (error) {
            logger.error('Sipariş güncellenirken hata:', error);
            return ResponseHandler.error(res, error.message);
        }
    },

    // Tüm siparişleri getirme
    getAllOrders: async (req, res) => {
        try {
            const result = await sql.query`
                SELECT 
                    o.id,
                    o.table_number,
                    o.status,
                    o.total_amount,
                    o.created_at,
                    (
                        SELECT COUNT(*) 
                        FROM order_items 
                        WHERE order_id = o.id
                    ) as item_count
                FROM orders o
                ORDER BY o.created_at DESC
            `;

            return ResponseHandler.success(res, result.recordset);

        } catch (error) {
            logger.error('Siparişler listelenirken hata:', error);
            return ResponseHandler.error(res, error.message);
        }
    },

    // Sipariş detayını getirme
    getOrderDetails: async (req, res) => {
        try {
            const { id } = req.params;

            // Sipariş başlık bilgileri
            const orderResult = await sql.query`
                SELECT 
                    o.id,
                    o.table_number,
                    o.status,
                    o.total_amount,
                    o.created_at
                FROM orders o
                WHERE o.id = ${id}
            `;

            if (orderResult.recordset.length === 0) {
                return ResponseHandler.error(res, 'Sipariş bulunamadı', 404);
            }

            // Sipariş detayları
            const itemsResult = await sql.query`
                SELECT 
                    oi.id,
                    oi.quantity,
                    oi.unit_price,
                    oi.total_price,
                    p.name as product_name
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = ${id}
            `;

            const order = orderResult.recordset[0];
            order.items = itemsResult.recordset;

            return ResponseHandler.success(res, order);

        } catch (error) {
            logger.error('Sipariş detayı getirilirken hata:', error);
            return ResponseHandler.error(res, error.message);
        }
    },

    // Masa bazlı aktif siparişleri getirme
    getActiveOrdersByTable: async (req, res) => {
        try {
            const { table_number } = req.params;

            const result = await sql.query`
                SELECT 
                    o.id,
                    o.status,
                    o.total_amount,
                    o.created_at,
                    (
                        SELECT COUNT(*) 
                        FROM order_items 
                        WHERE order_id = o.id
                    ) as item_count
                FROM orders o
                WHERE o.table_number = ${table_number}
                AND o.status NOT IN ('completed', 'cancelled')
                ORDER BY o.created_at DESC
            `;

            return ResponseHandler.success(res, result.recordset);

        } catch (error) {
            logger.error('Masa siparişleri getirilirken hata:', error);
            return ResponseHandler.error(res, error.message);
        }
    },

    // Günlük sipariş raporu
    getDailyOrders: async (req, res) => {
        try {
            const { date } = req.query;
            const searchDate = date || new Date().toISOString().split('T')[0];

            const result = await sql.query`
                SELECT 
                    o.id,
                    o.table_number,
                    o.status,
                    o.total_amount,
                    o.created_at,
                    (
                        SELECT COUNT(*) 
                        FROM order_items 
                        WHERE order_id = o.id
                    ) as item_count
                FROM orders o
                WHERE CAST(o.created_at AS DATE) = ${searchDate}
                ORDER BY o.created_at DESC
            `;

            // Günlük toplam
            const totalResult = await sql.query`
                SELECT 
                    COUNT(*) as total_orders,
                    SUM(total_amount) as total_amount
                FROM orders
                WHERE CAST(created_at AS DATE) = ${searchDate}
            `;

            return ResponseHandler.success(res, {
                orders: result.recordset,
                summary: totalResult.recordset[0]
            });

        } catch (error) {
            logger.error('Günlük rapor oluşturulurken hata:', error);
            return ResponseHandler.error(res, error.message);
        }
    }
};

module.exports = orderController;