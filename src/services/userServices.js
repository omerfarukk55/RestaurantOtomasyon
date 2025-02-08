// services/userService.js
const { sql } = require('../../config/database');
const bcrypt = require('bcryptjs');

class UserService {
    /**
     * Yeni personel oluşturma (Sadece admin)
     */
    async createUser(userData) {
        try {
            const {
                username,
                password,
                full_name,
                role,
                phone
            } = userData;

            // Kullanıcı adı kontrolü
            const existingUser = await this.getUserByUsername(username);
            if (existingUser) {
                throw new Error('Bu kullanıcı adı zaten kullanılıyor');
            }

            // Rol kontrolü (admin rolü verilemez)
            if (role === 'admin') {
                throw new Error('Admin rolü atanamaz');
            }

            // Şifre hash'leme
            const hashedPassword = await bcrypt.hash(password, 12);

            const result = await sql.query`
                INSERT INTO users (
                    username,
                    password,
                    full_name,
                    role,
                    phone,
                    is_active,
                    created_at
                )
                VALUES (
                    ${username},
                    ${hashedPassword},
                    ${full_name},
                    ${role},
                    ${phone},
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

    /**
     * Personel bilgilerini güncelleme
     */
    async updateUser(userId, userData) {
        try {
            const {
                full_name,
                phone,
                role,
                is_active
            } = userData;

            // Kullanıcı kontrolü
            const user = await this.getUserById(userId);
            if (!user) {
                throw new Error('Kullanıcı bulunamadı');
            }

            // Admin kullanıcısını güncellemeyi engelle
            if (user.role === 'admin') {
                throw new Error('Admin bilgileri güncellenemez');
            }

            await sql.query`
                UPDATE users
                SET 
                    full_name = ${full_name},
                    phone = ${phone},
                    role = ${role},
                    is_active = ${is_active},
                    updated_at = GETDATE()
                WHERE id = ${userId}
            `;

            return true;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Tüm personel listesini getirme
     */
    async getAllUsers() {
        try {
            const result = await sql.query`
                SELECT 
                    id,
                    username,
                    full_name,
                    role,
                    phone,
                    is_active,
                    last_login,
                    created_at
                FROM users
                WHERE role != 'admin'
                ORDER BY created_at DESC
            `;

            return result.recordset;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Aktif personel listesini getirme
     */
    async getActiveUsers() {
        try {
            const result = await sql.query`
                SELECT 
                    id,
                    username,
                    full_name,
                    role,
                    phone
                FROM users
                WHERE is_active = 1 AND role != 'admin'
                ORDER BY full_name
            `;

            return result.recordset;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Personel detaylarını getirme
     */
    async getUserDetails(userId) {
        try {
            // Kullanıcı bilgileri
            const userResult = await sql.query`
                SELECT 
                    id,
                    username,
                    full_name,
                    role,
                    phone,
                    is_active,
                    last_login,
                    created_at
                FROM users
                WHERE id = ${userId} AND role != 'admin'
            `;

            if (userResult.recordset.length === 0) {
                throw new Error('Kullanıcı bulunamadı');
            }

            const user = userResult.recordset[0];

            // Son siparişleri getir
            const ordersResult = await sql.query`
                SELECT TOP 10
                    o.id,
                    o.table_number,
                    o.total_amount,
                    o.status,
                    o.created_at
                FROM orders o
                WHERE o.created_by = ${userId}
                ORDER BY o.created_at DESC
            `;

            user.recent_orders = ordersResult.recordset;

            return user;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Kullanıcı silme (soft delete)
     */
    async deleteUser(userId) {
        try {
            const user = await this.getUserById(userId);
            if (!user) {
                throw new Error('Kullanıcı bulunamadı');
            }

            if (user.role === 'admin') {
                throw new Error('Admin kullanıcısı silinemez');
            }

            await sql.query`
                UPDATE users
                SET 
                    is_active = 0,
                    updated_at = GETDATE()
                WHERE id = ${userId}
            `;

            return true;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Kullanıcı adına göre kullanıcı getirme
     */
    async getUserByUsername(username) {
        try {
            const result = await sql.query`
                SELECT id, username
                FROM users
                WHERE username = ${username}
            `;

            return result.recordset[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * ID'ye göre kullanıcı getirme
     */
    async getUserById(userId) {
        try {
            const result = await sql.query`
                SELECT id, username, role
                FROM users
                WHERE id = ${userId}
            `;

            return result.recordset[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Role göre kullanıcıları getirme
     */
    async getUsersByRole(role) {
        try {
            const result = await sql.query`
                SELECT 
                    id,
                    username,
                    full_name,
                    phone
                FROM users
                WHERE role = ${role} AND is_active = 1
                ORDER BY full_name
            `;

            return result.recordset;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new UserService();