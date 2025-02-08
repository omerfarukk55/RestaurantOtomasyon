// services/authService.js
const { sql } = require('../../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../../config/config');

class AuthService {
    /**
     * Kullanıcı doğrulama ve token oluşturma
     */
    async authenticate(username, password) {
        try {
            // Kullanıcıyı bul
            const result = await sql.query`
                SELECT 
                    id,
                    username,
                    password,
                    role,
                    full_name,
                    is_active
                FROM users
                WHERE username = ${username}
            `;

            const user = result.recordset[0];

            // Kullanıcı kontrolü
            if (!user) {
                throw new Error('Kullanıcı bulunamadı');
            }

            // Aktif kullanıcı kontrolü
            if (!user.is_active) {
                throw new Error('Kullanıcı hesabı aktif değil');
            }

            // Şifre kontrolü
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                throw new Error('Geçersiz şifre');
            }

            // Token oluştur
            const token = this.generateToken(user);

            // Son giriş zamanını güncelle
            await this.updateLastLogin(user.id);

            return {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    fullName: user.full_name
                }
            };

        } catch (error) {
            throw error;
        }
    }

    /**
     * JWT Token oluşturma
     */
    generateToken(user) {
        return jwt.sign(
            {
                userId: user.id,
                role: user.role,
                fullName: user.full_name
            },
            config.jwt.secret,
            { expiresIn: config.jwt.expire }
        );
    }

    /**
     * Token doğrulama
     */
    verifyToken(token) {
        try {
            return jwt.verify(token, config.jwt.secret);
        } catch (error) {
            throw new Error('Geçersiz token');
        }
    }

    /**
     * Son giriş zamanını güncelleme
     */
    async updateLastLogin(userId) {
        try {
            await sql.query`
                UPDATE users
                SET last_login = GETDATE()
                WHERE id = ${userId}
            `;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Şifre değiştirme
     */
    async changePassword(userId, currentPassword, newPassword) {
        try {
            // Mevcut şifreyi kontrol et
            const userResult = await sql.query`
                SELECT password
                FROM users
                WHERE id = ${userId}
            `;

            if (!userResult.recordset[0]) {
                throw new Error('Kullanıcı bulunamadı');
            }

            const isValidPassword = await bcrypt.compare(
                currentPassword,
                userResult.recordset[0].password
            );

            if (!isValidPassword) {
                throw new Error('Mevcut şifre yanlış');
            }

            // Yeni şifreyi hashle ve güncelle
            const hashedPassword = await bcrypt.hash(newPassword, 12);

            await sql.query`
                UPDATE users
                SET 
                    password = ${hashedPassword},
                    updated_at = GETDATE()
                WHERE id = ${userId}
            `;

            return true;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Admin için şifre sıfırlama
     */
    async resetPassword(userId, adminId) {
        try {
            // Admin kontrolü
            const adminResult = await sql.query`
                SELECT role FROM users WHERE id = ${adminId}
            `;

            if (!adminResult.recordset[0] || adminResult.recordset[0].role !== 'admin') {
                throw new Error('Bu işlem için admin yetkisi gereklidir');
            }

            // Hedef kullanıcıyı kontrol et
            const userResult = await sql.query`
                SELECT role FROM users WHERE id = ${userId}
            `;

            if (!userResult.recordset[0]) {
                throw new Error('Kullanıcı bulunamadı');
            }

            // Admin'in şifresini sıfırlamasını engelle
            if (userResult.recordset[0].role === 'admin') {
                throw new Error('Admin şifresi sıfırlanamaz');
            }

            // Varsayılan şifreyi hashle ve güncelle
            const defaultPassword = '123456';
            const hashedPassword = await bcrypt.hash(defaultPassword, 12);

            await sql.query`
                UPDATE users
                SET 
                    password = ${hashedPassword},
                    updated_at = GETDATE()
                WHERE id = ${userId}
            `;

            return defaultPassword;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Oturum kontrolü
     */
    async checkSession(userId) {
        try {
            const result = await sql.query`
                SELECT 
                    id,
                    username,
                    role,
                    full_name,
                    is_active
                FROM users
                WHERE id = ${userId}
            `;

            const user = result.recordset[0];

            if (!user || !user.is_active) {
                throw new Error('Geçersiz oturum');
            }

            return user;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Şifre karmaşıklığını kontrol et
     */
    validatePassword(password) {
        // En az 6 karakter
        if (password.length < 6) {
            return false;
        }

        // En az bir rakam
        if (!/\d/.test(password)) {
            return false;
        }

        return true;
    }
}

module.exports = new AuthService();