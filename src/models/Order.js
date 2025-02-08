
// src/models/Order.js
class Order {
    constructor(data) {
        this.id = data.id;
        this.table_number = data.table_number;
        this.status = data.status || 'pending';
        this.total_amount = data.total_amount || 0;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
        this.items = data.items || [];
    }

    static getTableName() {
        return 'orders';
    }

    static getItemsTableName() {
        return 'order_items';
    }

    // Statik metodlar
    static fromDB(data) {
        return new Order(data);
    }

    // Validation metodları
    static validateStatus(status) {
        const validStatuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];
        return validStatuses.includes(status);
    }

    static validateTableNumber(tableNumber) {
        return tableNumber && Number.isInteger(Number(tableNumber)) && tableNumber > 0;
    }

    static validateItems(items) {
        return Array.isArray(items) && items.length > 0 && items.every(item => 
            item.product_id && 
            Number.isInteger(Number(item.product_id)) && 
            item.quantity && 
            Number.isInteger(Number(item.quantity)) && 
            item.quantity > 0
        );
    }

    // SQL Queries
    static async create(sql, orderData) {
        const transaction = new sql.Transaction();
        try {
            await transaction.begin();

            // Ana sipariş kaydı
            const orderResult = await sql.query`
                INSERT INTO orders (
                    table_number,
                    status,
                    total_amount,
                    created_at
                )
                VALUES (
                    ${orderData.table_number},
                    'pending',
                    0,
                    GETDATE()
                )
                SELECT SCOPE_IDENTITY() as id
            `;

            const orderId = orderResult.recordset[0].id;
            let totalAmount = 0;

            // Sipariş detayları
            for (const item of orderData.items) {
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

            // Toplam tutarı güncelle
            await sql.query`
                UPDATE orders 
                SET total_amount = ${totalAmount}
                WHERE id = ${orderId}
            `;

            await transaction.commit();
            return { orderId, totalAmount };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    static async getById(sql, id) {
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
            return null;
        }

        const itemsResult = await sql.query`
            SELECT 
                oi.id,
                oi.quantity,
                oi.unit_price,
                oi.total_price,
                p.name as product_name,
                p.id as product_id
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ${id}
        `;

        const order = orderResult.recordset[0];
        order.items = itemsResult.recordset;
        return Order.fromDB(order);
    }

    static async updateStatus(sql, id, status) {
        if (!this.validateStatus(status)) {
            throw new Error('Geçersiz sipariş durumu');
        }

        await sql.query`
            UPDATE orders 
            SET 
                status = ${status},
                updated_at = GETDATE()
            WHERE id = ${id}
        `;
    }

    static async getActiveByTable(sql, tableNumber) {
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
            WHERE o.table_number = ${tableNumber}
            AND o.status NOT IN ('completed', 'cancelled')
            ORDER BY o.created_at DESC
        `;

        return result.recordset.map(order => Order.fromDB(order));
    }

    static async getDailyOrders(sql, date) {
        const searchDate = date || new Date().toISOString().split('T')[0];

        const ordersResult = await sql.query`
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

        const totalResult = await sql.query`
            SELECT 
                COUNT(*) as total_orders,
                SUM(total_amount) as total_amount
            FROM orders
            WHERE CAST(created_at AS DATE) = ${searchDate}
        `;

        return {
            orders: ordersResult.recordset.map(order => Order.fromDB(order)),
            summary: totalResult.recordset[0]
        };
    }
}

module.exports = Order;