// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const config = require('../../config/config');
const ResponseHandler = require('../utils/responseHandler');

exports.verifyToken = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return ResponseHandler.error(res, 'Token bulunamadı', 401);
        }

        // Token'ı doğrula
        const decoded = jwt.verify(token, config.jwt.secret);
        
        // Kullanıcı bilgilerini request nesnesine ekle
        req.userData = decoded;
        next();
    } catch (error) {
        return ResponseHandler.error(res, 'Geçersiz token', 401);
    }
};

exports.isAdmin = (req, res, next) => {
    try {
        // Önce token doğrulaması yap
        this.verifyToken(req, res, () => {
            // Token geçerliyse rol kontrolü yap
            if (req.userData.role !== 'admin') {
                return ResponseHandler.error(res, 'Admin yetkisi gerekli', 403);
            }
            next();
        });
    } catch (error) {
        return ResponseHandler.error(res, 'Yetkilendirme hatası', 500);
    }
};

// Rol bazlı yetkilendirme için genel middleware
exports.hasRole = (roles) => {
    return (req, res, next) => {
        try {
            // Önce token doğrulaması yap
            this.verifyToken(req, res, () => {
                // Token geçerliyse rol kontrolü yap
                if (!roles.includes(req.userData.role)) {
                    return ResponseHandler.error(res, 'Yetkisiz erişim', 403);
                }
                next();
            });
        } catch (error) {
            return ResponseHandler.error(res, 'Yetkilendirme hatası', 500);
        }
    };
};