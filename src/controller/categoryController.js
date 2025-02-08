// controllers/categoryController.js
const { sql } = require('../../config/database');

// Kategori ekleme (Admin)
exports.addCategory = async (req, res) => {
    try {
        const {
            name,
            description,
            image_url,
            display_order
        } = req.body;

        const result = await sql.query`
            INSERT INTO categories (
                name,
                description,
                image_url,
                display_order,
                is_active
            )
            VALUES (
                ${name},
                ${description},
                ${image_url},
                ${display_order},
                1
            )
            SELECT SCOPE_IDENTITY() as id
        `;

        res.status(201).json({
            message: 'Kategori başarıyla eklendi',
            categoryId: result.recordset[0].id
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Kategori güncelleme (Admin)
exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            description,
            image_url,
            display_order,
            is_active
        } = req.body;

        await sql.query`
            UPDATE categories
            SET name = ${name},
                description = ${description},
                image_url = ${image_url},
                display_order = ${display_order},
                is_active = ${is_active},
                updated_at = GETDATE()
            WHERE id = ${id}
        `;

        res.json({ message: 'Kategori başarıyla güncellendi' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Kategori silme (Admin)
exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        // Önce bu kategoriye ait ürün var mı kontrol et
        const productCheck = await sql.query`
            SELECT COUNT(*) as count 
            FROM products 
            WHERE category_id = ${id} AND is_available = 1
        `;

        if (productCheck.recordset[0].count > 0) {
            return res.status(400).json({ 
                message: 'Bu kategoriye ait aktif ürünler var. Önce ürünleri silmeniz gerekiyor.' 
            });
        }

        // Soft delete yap
        await sql.query`
            UPDATE categories
            SET is_active = 0,
                updated_at = GETDATE()
            WHERE id = ${id}
        `;

        res.json({ message: 'Kategori başarıyla silindi' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Tüm kategorileri getir (Admin)
exports.getAllCategoriesAdmin = async (req, res) => {
    try {
        const result = await sql.query`
            SELECT 
                c.*,
                (SELECT COUNT(*) FROM products WHERE category_id = c.id AND is_available = 1) as product_count
            FROM categories c
            ORDER BY c.display_order, c.name
        `;

        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Aktif kategorileri getir (Müşteri)
exports.getActiveCategories = async (req, res) => {
    try {
        const result = await sql.query`
            SELECT 
                c.*,
                (SELECT COUNT(*) FROM products WHERE category_id = c.id AND is_available = 1) as product_count
            FROM categories c
            WHERE c.is_active = 1
            ORDER BY c.display_order, c.name
        `;

        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Kategori detayı getir
exports.getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await sql.query`
            SELECT 
                c.*,
                (SELECT COUNT(*) FROM products WHERE category_id = c.id AND is_available = 1) as product_count
            FROM categories c
            WHERE c.id = ${id}
        `;

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Kategori bulunamadı' });
        }

        // Kategoriye ait ürünleri de getir
        const products = await sql.query`
            SELECT *
            FROM products
            WHERE category_id = ${id} AND is_available = 1
            ORDER BY name
        `;

        const category = result.recordset[0];
        category.products = products.recordset;

        res.json(category);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Kategorileri sıralama güncelleme (Admin)
exports.updateCategoryOrder = async (req, res) => {
    try {
        const { orderData } = req.body; // [{id: 1, order: 1}, {id: 2, order: 2}]

        for (const item of orderData) {
            await sql.query`
                UPDATE categories
                SET display_order = ${item.order}
                WHERE id = ${item.id}
            `;
        }

        res.json({ message: 'Kategori sıralaması güncellendi' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};