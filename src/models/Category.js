// src/models/Category.js
class Category {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.description = data.description;
        this.image_url = data.image_url;
        this.display_order = data.display_order;
        this.is_active = data.is_active;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
        this.product_count = data.product_count;
        this.products = data.products || [];
    }

    static getTableName() {
        return 'categories';
    }

    // Model metodları
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            image_url: this.image_url,
            display_order: this.display_order,
            is_active: this.is_active,
            created_at: this.created_at,
            product_count: this.product_count,
            products: this.products
        };
    }

    // Statik metodlar
    static fromDB(data) {
        return new Category(data);
    }

    // Validation metodları
    static validateName(name) {
        return name && name.trim().length >= 2;
    }

    static validateDisplayOrder(order) {
        return order === null || (Number.isInteger(Number(order)) && order >= 0);
    }

    // Database işlemleri
    static async create(sql, categoryData) {
        try {
            const result = await sql.query`
                INSERT INTO ${this.getTableName()} (
                    name,
                    description,
                    image_url,
                    display_order,
                    is_active,
                    created_at
                )
                VALUES (
                    ${categoryData.name},
                    ${categoryData.description},
                    ${categoryData.image_url},
                    ${categoryData.display_order},
                    1,
                    GETDATE()
                )
                SELECT SCOPE_IDENTITY() as id
            `;

            return result.recordset[0].id;
        } catch (error) {
            throw error;
        }
    }

    static async update(sql, id, categoryData) {
        try {
            await sql.query`
                UPDATE ${this.getTableName()}
                SET name = ${categoryData.name},
                    description = ${categoryData.description},
                    image_url = ${categoryData.image_url},
                    display_order = ${categoryData.display_order},
                    is_active = ${categoryData.is_active},
                    updated_at = GETDATE()
                WHERE id = ${id}
            `;
        } catch (error) {
            throw error;
        }
    }

    static async delete(sql, id) {
        try {
            // Önce ürün kontrolü
            const productCheck = await sql.query`
                SELECT COUNT(*) as count 
                FROM products 
                WHERE category_id = ${id} AND is_available = 1
            `;

            if (productCheck.recordset[0].count > 0) {
                throw new Error('Bu kategoriye ait aktif ürünler var. Önce ürünleri silmeniz gerekiyor.');
            }

            await sql.query`
                UPDATE ${this.getTableName()}
                SET is_active = 0,
                    updated_at = GETDATE()
                WHERE id = ${id}
            `;
        } catch (error) {
            throw error;
        }
    }

    static async getById(sql, id, includeProducts = false) {
        try {
            const result = await sql.query`
                SELECT 
                    c.*,
                    (SELECT COUNT(*) FROM products WHERE category_id = c.id AND is_available = 1) as product_count
                FROM ${this.getTableName()} c
                WHERE c.id = ${id}
            `;

            if (result.recordset.length === 0) {
                return null;
            }

            const category = result.recordset[0];

            if (includeProducts) {
                const products = await sql.query`
                    SELECT *
                    FROM products
                    WHERE category_id = ${id} AND is_available = 1
                    ORDER BY name
                `;
                category.products = products.recordset;
            }

            return this.fromDB(category);
        } catch (error) {
            throw error;
        }
    }

    static async getAll(sql) {
        try {
            const result = await sql.query`
                SELECT 
                    c.*,
                    (SELECT COUNT(*) FROM products WHERE category_id = c.id AND is_available = 1) as product_count
                FROM ${this.getTableName()} c
                ORDER BY c.display_order, c.name
            `;

            return result.recordset.map(category => this.fromDB(category));
        } catch (error) {
            throw error;
        }
    }

    static async getActive(sql) {
        try {
            const result = await sql.query`
                SELECT 
                    c.*,
                    (SELECT COUNT(*) FROM products WHERE category_id = c.id AND is_available = 1) as product_count
                FROM ${this.getTableName()} c
                WHERE c.is_active = 1
                ORDER BY c.display_order, c.name
            `;

            return result.recordset.map(category => this.fromDB(category));
        } catch (error) {
            throw error;
        }
    }

    static async updateOrder(sql, orderData) {
        try {
            for (const item of orderData) {
                await sql.query`
                    UPDATE ${this.getTableName()}
                    SET display_order = ${item.order}
                    WHERE id = ${item.id}
                `;
            }
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Category;