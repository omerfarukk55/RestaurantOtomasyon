// src/models/Product.js
class Product {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.description = data.description;
        this.price = data.price;
        this.category_id = data.category_id;
        this.category_name = data.category_name;
        this.image_url = data.image_url;
        this.is_available = data.is_available;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    static getTableName() {
        return 'products';
    }

    // Model metodları
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            price: this.price,
            category_id: this.category_id,
            category_name: this.category_name,
            image_url: this.image_url,
            is_available: this.is_available,
            created_at: this.created_at
        };
    }

    // Statik metodlar
    static fromDB(data) {
        return new Product(data);
    }

    // Validation metodları
    static validatePrice(price) {
        return price && !isNaN(price) && price >= 0;
    }

    static validateName(name) {
        return name && name.trim().length >= 2;
    }

    static validateCategoryId(categoryId) {
        return categoryId && Number.isInteger(Number(categoryId)) && categoryId > 0;
    }

    // Database işlemleri
    static async create(sql, productData) {
        try {
            const result = await sql.query`
                INSERT INTO ${this.getTableName()} (
                    name,
                    description,
                    price,
                    category_id,
                    image_url,
                    is_available,
                    created_at
                )
                VALUES (
                    ${productData.name},
                    ${productData.description},
                    ${productData.price},
                    ${productData.category_id},
                    ${productData.image_url},
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

    static async update(sql, id, productData) {
        try {
            await sql.query`
                UPDATE ${this.getTableName()}
                SET name = ${productData.name},
                    description = ${productData.description},
                    price = ${productData.price},
                    category_id = ${productData.category_id},
                    image_url = ${productData.image_url},
                    is_available = ${productData.is_available},
                    updated_at = GETDATE()
                WHERE id = ${id}
            `;
        } catch (error) {
            throw error;
        }
    }

    static async delete(sql, id) {
        try {
            await sql.query`
                UPDATE ${this.getTableName()}
                SET is_available = 0,
                    updated_at = GETDATE()
                WHERE id = ${id}
            `;
        } catch (error) {
            throw error;
        }
    }

    static async getById(sql, id) {
        try {
            const result = await sql.query`
                SELECT 
                    p.*,
                    c.name as category_name
                FROM ${this.getTableName()} p
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE p.id = ${id}
            `;

            return result.recordset.length ? this.fromDB(result.recordset[0]) : null;
        } catch (error) {
            throw error;
        }
    }

    static async getAllActive(sql) {
        try {
            const result = await sql.query`
                SELECT 
                    p.*,
                    c.name as category_name
                FROM ${this.getTableName()} p
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE p.is_available = 1
                ORDER BY c.name, p.name
            `;

            return result.recordset.map(product => this.fromDB(product));
        } catch (error) {
            throw error;
        }
    }

    static async getAll(sql) {
        try {
            const result = await sql.query`
                SELECT 
                    p.*,
                    c.name as category_name
                FROM ${this.getTableName()} p
                LEFT JOIN categories c ON p.category_id = c.id
                ORDER BY p.created_at DESC
            `;

            return result.recordset.map(product => this.fromDB(product));
        } catch (error) {
            throw error;
        }
    }

    static async getByCategory(sql, categoryId) {
        try {
            const result = await sql.query`
                SELECT 
                    p.*,
                    c.name as category_name
                FROM ${this.getTableName()} p
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE p.category_id = ${categoryId}
                AND p.is_available = 1
                ORDER BY p.name
            `;

            return result.recordset.map(product => this.fromDB(product));
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Product;