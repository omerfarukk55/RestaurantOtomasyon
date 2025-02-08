// controllers/productController.js
const { sql } = require('../../config/database');

// Admin için ürün yönetimi işlemleri
exports.addProduct = async (req, res) => {
    try {
        const {
            name,
            description,
            price,
            category_id,
            cost_price,
            image_url,
            stock_quantity,
            vat_rate,
            preparation_time
        } = req.body;

        const result = await sql.query`
            INSERT INTO products (
                name,
                description,
                price,
                category_id,
                cost_price,
                image_url,
                stock_quantity,
                vat_rate,
                preparation_time,
                is_available
            )
            VALUES (
                ${name},
                ${description},
                ${price},
                ${category_id},
                ${cost_price},
                ${image_url},
                ${stock_quantity},
                ${vat_rate},
                ${preparation_time},
                1
            )
            SELECT SCOPE_IDENTITY() as id
        `;

        res.status(201).json({
            message: 'Ürün başarıyla eklendi',
            productId: result.recordset[0].id
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            description,
            price,
            category_id,
            cost_price,
            image_url,
            stock_quantity,
            vat_rate,
            preparation_time,
            is_available
        } = req.body;

        await sql.query`
            UPDATE products
            SET name = ${name},
                description = ${description},
                price = ${price},
                category_id = ${category_id},
                cost_price = ${cost_price},
                image_url = ${image_url},
                stock_quantity = ${stock_quantity},
                vat_rate = ${vat_rate},
                preparation_time = ${preparation_time},
                is_available = ${is_available},
                updated_at = GETDATE()
            WHERE id = ${id}
        `;

        res.json({ message: 'Ürün başarıyla güncellendi' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        // Fiziksel silme yerine soft delete yapıyoruz
        await sql.query`
            UPDATE products
            SET is_available = 0,
                updated_at = GETDATE()
            WHERE id = ${id}
        `;

        res.json({ message: 'Ürün başarıyla silindi' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Admin için ürün listeleme
exports.getAllProductsAdmin = async (req, res) => {
    try {
        const result = await sql.query`
            SELECT 
                p.*,
                c.name as category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            ORDER BY p.created_at DESC
        `;

        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Müşteriler için ürün listeleme (sadece aktif ürünler)
exports.getActiveProducts = async (req, res) => {
    try {
        const result = await sql.query`
            SELECT 
                p.*,
                c.name as category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.is_available = 1
            ORDER BY c.name, p.name
        `;

        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Ürün detayı görüntüleme
exports.getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await sql.query`
            SELECT 
                p.*,
                c.name as category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = ${id}
        `;

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Ürün bulunamadı' });
        }

        res.json(result.recordset[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};