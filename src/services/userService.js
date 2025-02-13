// services/userService.js
const { sql } = require('../../config/database');
const  User  = require('../models/User');
const logger = require('./loggerService');

class UserService {
    /**
     * Yeni personel oluşturma
     */
    async createUser(userData) {
        try {
            // Model validasyonları
            if (!User.validateUsername(userData.username)) {
                throw new Error('Geçersiz kullanıcı adı');
            }

            if (!User.validateRole(userData.role)) {
                throw new Error('Geçersiz rol');
            }

            if (!User.validatePassword(userData.password)) {
                throw new Error('Geçersiz şifre');
            }

            // Kullanıcı adı kontrolü
            const userCheck = await sql.query`
                SELECT id FROM ${User.getTableName()} 
                WHERE username = ${userData.username}
            `;

            if (userCheck.recordset.length > 0) {
                throw new Error('Bu kullanıcı adı zaten kullanılıyor');
            }

            const result = await sql.query`
                INSERT INTO ${User.getTableName()} (
                    username,
                    password,
                    full_name,
                    role,
                    phone,
                    is_active,
                    created_at
                )
                VALUES (
                    ${userData.username},
                    ${userData.password},
                    ${userData.full_name},
                    ${userData.role},
                    ${userData.phone},
                    1,
                    GETDATE()
                )
                SELECT SCOPE_IDENTITY() as id
            `;

            const newUser = User.fromDB({
                id: result.recordset[0].id,
                ...userData
            });

            logger.info(`Yeni personel oluşturuldu: ${userData.username}, Rol: ${userData.role}`);
            return newUser.toJSON();
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
            if (userData.role && !User.validateRole(userData.role)) {
                throw new Error('Geçersiz rol');
            }

            const userCheck = await sql.query`
                SELECT * FROM ${User.getTableName()} WHERE id = ${id}
            `;

            if (userCheck.recordset.length === 0) {
                throw new Error('Personel bulunamadı');
            }

            const currentUser = User.fromDB(userCheck.recordset[0]);

            if (currentUser.role === 'admin') {
                throw new Error('Admin bilgileri değiştirilemez');
            }

            await sql.query`
                UPDATE ${User.getTableName()}
                SET full_name = ${userData.full_name},
                    phone = ${userData.phone},
                    role = ${userData.role},
                    is_active = ${userData.is_active},
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
                SELECT * FROM ${User.getTableName()}
                WHERE role != 'admin'
                ORDER BY role, full_name
            `;

            return result.recordset.map(user => User.fromDB(user).toJSON());
        } catch (error) {
            logger.error('Personel listelenirken hata:', error);
            throw error;
        }
    }

    // Diğer metodlar benzer şekilde güncellenecek...
}

module.exports = new UserService();