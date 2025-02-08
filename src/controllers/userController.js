// src/controllers/userController.js
const userService = require('../services/userService');
const ResponseHandler = require('../utils/responseHandler');

const userController = {
    // Yeni personel oluşturma
    createUser: async (req, res) => {
        try {
            const result = await userService.createUser(req.body);
            return ResponseHandler.success(res, result, 'Personel başarıyla oluşturuldu', 201);
        } catch (error) {
            return ResponseHandler.error(res, error.message);
        }
    },

    // Personel güncelleme
    updateUser: async (req, res) => {
        try {
            const result = await userService.updateUser(req.params.id, req.body);
            return ResponseHandler.success(res, result, 'Personel bilgileri güncellendi');
        } catch (error) {
            return ResponseHandler.error(res, error.message);
        }
    },

    // Tüm personel listesi
    getAllStaff: async (req, res) => {
        try {
            const staff = await userService.getAllStaff();
            return ResponseHandler.success(res, staff);
        } catch (error) {
            return ResponseHandler.error(res, error.message);
        }
    },

    // Personel detayı
    getStaffDetails: async (req, res) => {
        try {
            const staff = await userService.getStaffDetails(req.params.id);
            return ResponseHandler.success(res, staff);
        } catch (error) {
            return ResponseHandler.error(res, error.message);
        }
    },

    // Personel performans raporu
    getStaffPerformance: async (req, res) => {
        try {
            const performance = await userService.getStaffPerformance(
                req.params.id,
                req.query.startDate,
                req.query.endDate
            );
            return ResponseHandler.success(res, performance);
        } catch (error) {
            return ResponseHandler.error(res, error.message);
        }
    },

    // Personel silme (soft delete)
    deleteStaff: async (req, res) => {
        try {
            await userService.deleteStaff(req.params.id);
            return ResponseHandler.success(res, null, 'Personel başarıyla silindi');
        } catch (error) {
            return ResponseHandler.error(res, error.message);
        }
    },

    // Personel şifre sıfırlama
    resetStaffPassword: async (req, res) => {
        try {
            await userService.resetStaffPassword(req.params.id);
            return ResponseHandler.success(res, null, 'Şifre başarıyla sıfırlandı');
        } catch (error) {
            return ResponseHandler.error(res, error.message);
        }
    }
};

module.exports = userController;