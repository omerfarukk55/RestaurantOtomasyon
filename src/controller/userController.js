// services/userService.js
const { sql } = require('../../config/database');
const bcrypt = require('bcryptjs');
const logger = require('./loggerService');

const ROLES = {
    CASHIER: 'cashier',
    WAITER: 'waiter'
};

class UserService {
    /**
     * Yeni personel oluşturma
     */
    async createUser(userData) {
        try {
            const { username, password, full_name, role, phone } = userData;

            // Role kontrolü
            if (!Object.values(ROLES).includes(role)) {
                throw new Error('Geçersiz rol');
            }

            // Kullanıcı adı kontrolü
            const userCheck = await sql.query`
                SELECT id FROM users WHERE username = ${username}
            `;

            if (userCheck.recordset.length > 0) {
                throw new Error('Bu kullanıcı adı zaten kullanılıyor');
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

            logger.info(`Yeni personel oluşturuldu: ${username}, Rol: ${role}`);
            return {
                id: result.recordset[0].id,
                username,
                role
            };
        } catch (error) {
            logger.error('Personel oluşturulurken hata:', error);
            throw error;
        }
    }

    /**
     * Personel güncelleme
     */
    async updateUser(id, userData) {
        try {
            const { full_name, phone, role, is_active } = userData;

            // Role kontrolü
            if (role && !Object.values(ROLES).includes(role)) {
                throw new Error('Geçersiz rol');
            }

            // Personel kontrolü
            const userCheck = await sql.query`
                SELECT role FROM users WHERE id = ${id}
            `;

            if (userCheck.recordset.length === 0) {
                throw new Error('Personel bulunamadı');
            }

            if (userCheck.recordset[0].role === 'admin') {
                throw new Error('Admin bilgileri değiştirilemez');
            }

            await sql.query`
                UPDATE users
                SET full_name = ${full_name},
                    phone = ${phone},
                    role = ${role},
                    is_active = ${is_active},
                    updated_at = GETDATE()
                WHERE id = ${id} AND role != 'admin'
            `;

            logger.info(`Personel güncellendi: ID ${id}`);
            return { id };
        } catch (error) {
            logger.error('Personel güncellenirken hata:', error);
            throw error;
        }
    }

    /**
     * Tüm personel listesini getir
     */
    async getAllStaff() {
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
                ORDER BY role, full_name
            `;

            return result.recordset;
        } catch (error) {
            logger.error('Personel listelenirken hata:', error);
            throw error;
        }
    }

    /**
     * Personel detaylarını getir
     */
    async getStaffDetails(id) {
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
                WHERE id = ${id} AND role != 'admin'
            `;

            if (result.recordset.length === 0) {
                throw new Error('Personel bulunamadı');
            }

            const ordersResult = await sql.query`
                SELECT TOP 10
                    id as order_id,
                    table_number,
                    total_amount,
                    status,
                    created_at
                FROM orders
                WHERE created_by = ${id}
                ORDER BY created_at DESC
            `;

            const staff = result.recordset[0];
            staff.recent_orders = ordersResult.recordset;

            return staff;
        } catch (error) {
            logger.error('Personel detayı getirilirken hata:', error);
            throw error;
        }
    }

    /**
     * Personel performans raporu
     */
    async getStaffPerformance(id, startDate, endDate) {
        try {
            const staffCheck = await sql.query`
                SELECT role FROM users 
                WHERE id = ${id} AND role != 'admin'
            `;

            if (staffCheck.recordset.length === 0) {
                throw new Error('Personel bulunamadı');
            }

            const result = await sql.query`
                SELECT 
                    COUNT(*) as total_orders,
                    SUM(total_amount) as total_sales,
                    COUNT(DISTINCT table_number) as total_tables_served
                FROM orders
                WHERE created_by = ${id}
                AND created_at BETWEEN ${startDate} AND ${endDate}
            `;

            const hourlyStats = await sql.query`
                SELECT 
                    DATEPART(HOUR, created_at) as hour,
                    COUNT(*) as order_count
                FROM orders
                WHERE created_by = ${id}
                AND created_at BETWEEN ${startDate} AND ${endDate}
                GROUP BY DATEPART(HOUR, created_at)
                ORDER BY hour
            `;

            return {
                summary: result.recordset[0],
                hourly_stats: hourlyStats.recordset
            };
        } catch (error) {
            logger.error('Performans raporu oluşturulurken hata:', error);
            throw error;
        }
    }
}

module.exports = new UserService();