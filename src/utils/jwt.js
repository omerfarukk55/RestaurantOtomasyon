// src/utils/jwt.js
const jwt = require('jsonwebtoken');
const config = require('../../config/config');

class JwtService {
    /**
     * Token oluşturma
     */
    static generateToken(userData) {
        try {
            return jwt.sign(
                {
                    userId: userData.id,
                    role: userData.role,
                    fullName: userData.full_name
                },
                config.jwt.secret,
                {
                    expiresIn: config.jwt.expiresIn // örn: '24h'
                }
            );
        } catch (error) {
            throw new Error('Token oluşturma hatası');
        }
    }

    /**
     * Token doğrulama
     */
    static verifyToken(token) {
        try {
            return jwt.verify(token, config.jwt.secret);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('Token süresi doldu');
            }
            throw new Error('Geçersiz token');
        }
    }

    /**
     * Token çözümleme (verify etmeden)
     */
    static decodeToken(token) {
        try {
            return jwt.decode(token);
        } catch (error) {
            throw new Error('Token çözümleme hatası');
        }
    }

    /**
     * Refresh token oluşturma
     */
    static generateRefreshToken(userId) {
        try {
            return jwt.sign(
                { userId },
                config.jwt.refreshSecret,
                { expiresIn: '30d' }
            );
        } catch (error) {
            throw new Error('Refresh token oluşturma hatası');
        }
    }

    /**
     * Token'dan kullanıcı bilgilerini alma
     */
    static getUserDataFromToken(token) {
        try {
            const decoded = this.verifyToken(token);
            return {
                userId: decoded.userId,
                role: decoded.role,
                fullName: decoded.fullName
            };
        } catch (error) {
            throw new Error('Token bilgileri alınamadı');
        }
    }
}

module.exports = JwtService;