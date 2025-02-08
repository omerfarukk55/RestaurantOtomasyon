// src/middleware/admin.js
const ResponseHandler = require('../utils/responseHandler');

const adminMiddleware = (req, res, next) => {
    try {
        // Auth middleware'den gelen userData kontrolü
        if (!req.userData) {
            return ResponseHandler.error(res, 'Yetkilendirme başarısız', 401);
        }

        // Kullanıcının rolünü kontrol et
        if (req.userData.role !== 'admin') {
            return ResponseHandler.error(res, 'Bu işlem için admin yetkisi gereklidir', 403);
        }

        // Admin ise bir sonraki middleware'e veya controller'a geç
        next();
    } catch (error) {
        return ResponseHandler.error(res, 'Yetkilendirme hatası', 500);
    }
};

module.exports = adminMiddleware;