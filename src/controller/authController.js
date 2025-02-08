// controllers/authController.js
const { sql } = require('../../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../../config/config');
const ResponseHandler = require('../utils/responseHandler');

const authController = {
    // Kullanıcı girişi
    login: async (req, res) => {
        try {
            const { username, password } = req.body;

            const result = await sql.query`
                SELECT id, username, password, role, full_name
                FROM users
                WHERE username = ${username} AND is_active = 1
            `;

            const user = result.recordset[0];

            if (!user || !(await bcrypt.compare(password, user.password))) {
                return ResponseHandler.error(res, 'Geçersiz kullanıcı adı veya şifre', 401);
            }

            // JWT token oluştur
            const token = jwt.sign(
                { 
                    userId: user.id, 
                    role: user.role,
                    fullName: user.full_name
                },
                config.jwt.secret,
                { expiresIn: config.jwt.expire }
            );

            // Son giriş zamanını güncelle
            await sql.query`
                UPDATE users
                SET last_login = GETDATE()
                WHERE id = ${user.id}
            `;

            return ResponseHandler.success(res, {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    fullName: user.full_name
                }
            });

        } catch (error) {
            return ResponseHandler.error(res, error.message);
        }
    },

    // Çıkış yapma
    logout: async (req, res) => {
        try {
            const userId = req.userData.userId;
            return ResponseHandler.success(res, null, 'Başarıyla çıkış yapıldı');
        } catch (error) {
            return ResponseHandler.error(res, error.message);
        }
    },

    // Şifre değiştirme
    changePassword: async (req, res) => {
        try {
            const { currentPassword, newPassword } = req.body;
            const userId = req.userData.userId;

            const userResult = await sql.query`
                SELECT password FROM users WHERE id = ${userId}
            `;

            if (!userResult.recordset[0]) {
                return ResponseHandler.error(res, 'Kullanıcı bulunamadı', 404);
            }

            const isValidPassword = await bcrypt.compare(
                currentPassword,
                userResult.recordset[0].password
            );

            if (!isValidPassword) {
                return ResponseHandler.error(res, 'Mevcut şifre yanlış', 400);
            }

            const hashedPassword = await bcrypt.hash(newPassword, 12);

            await sql.query`
                UPDATE users
                SET password = ${hashedPassword},
                    updated_at = GETDATE()
                WHERE id = ${userId}
            `;

            return ResponseHandler.success(res, null, 'Şifre başarıyla değiştirildi');

        } catch (error) {
            return ResponseHandler.error(res, error.message);
        }
    },

    // Admin için şifre sıfırlama
    resetPassword: async (req, res) => {
        try {
            const { userId } = req.params;
            const defaultPassword = '123456'; // Varsayılan şifre
            const hashedPassword = await bcrypt.hash(defaultPassword, 12);

            await sql.query`
                UPDATE users
                SET password = ${hashedPassword},
                    updated_at = GETDATE()
                WHERE id = ${userId} AND role != 'admin'
            `;

            return ResponseHandler.success(res, null, 'Şifre başarıyla sıfırlandı');
        } catch (error) {
            return ResponseHandler.error(res, error.message);
        }
    },

    // Oturum kontrolü
    checkSession: async (req, res) => {
        try {
            const userId = req.userData.userId;

            const result = await sql.query`
                SELECT id, username, role, full_name
                FROM users
                WHERE id = ${userId} AND is_active = 1
            `;

            if (result.recordset.length === 0) {
                return ResponseHandler.error(res, 'Geçersiz oturum', 401);
            }

            return ResponseHandler.success(res, result.recordset[0]);

        } catch (error) {
            return ResponseHandler.error(res, error.message);
        }
    }
};

module.exports = authController;