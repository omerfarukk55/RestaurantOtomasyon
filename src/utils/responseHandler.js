// src/utils/responseHandler.js
class ResponseHandler {
    static success(res, data, message = 'İşlem başarılı', statusCode = 200) {
        return res.status(statusCode).json({
            success: true,
            message,
            data
        });
    }

    static error(res, message = 'Bir hata oluştu', statusCode = 500, errors = null) {
        return res.status(statusCode).json({
            success: false,
            message,
            errors
        });
    }
}

module.exports = ResponseHandler;