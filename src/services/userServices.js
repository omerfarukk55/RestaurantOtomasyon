// controllers/userController.js
const userService = require('../services/userService');
const ResponseHandler = require('../utils/responseHandler');

const userController = {
    createUser: async (req, res) => {
        try {
            const result = await userService.createUser(req.body);
            return ResponseHandler.success(res, result, 'Personel başarıyla oluşturuldu', 201);
        } catch (error) {
            return ResponseHandler.error(res, error.message);
        }
    },

    updateUser: async (req, res) => {
        try {
            const result = await userService.updateUser(req.params.id, req.body);
            return ResponseHandler.success(res, result, 'Personel bilgileri güncellendi');
        } catch (error) {
            return ResponseHandler.error(res, error.message);
        }
    },

    getAllStaff: async (req, res) => {
        try {
            const staff = await userService.getAllStaff();
            return ResponseHandler.success(res, staff);
        } catch (error) {
            return ResponseHandler.error(res, error.message);
        }
    },

    getStaffDetails: async (req, res) => {
        try {
            const staff = await userService.getStaffDetails(req.params.id);
            return ResponseHandler.success(res, staff);
        } catch (error) {
            return ResponseHandler.error(res, error.message);
        }
    },

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
    }
};

module.exports = userController;