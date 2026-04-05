/**
 * Doctor Routes
 */
const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { authenticate, authorize } = require('../middlewares/auth');
const { paginationValidation, doctorCreateValidation, idParamValidation } = require('../middlewares/validation');

router.use(authenticate);

// Main CRUD routes
router.get('/', paginationValidation, doctorController.getDoctors);
router.post('/', doctorCreateValidation, authorize('ADMIN'), doctorController.createDoctor);
router.get('/specializations', doctorController.getSpecializations);
router.get('/:id', idParamValidation, doctorController.getDoctorById);
router.put('/:id', idParamValidation, authorize('ADMIN'), doctorController.updateDoctor);
router.delete('/:id', idParamValidation, authorize('ADMIN'), doctorController.deleteDoctor);

// Related data routes
router.get('/:id/patients', idParamValidation, paginationValidation, doctorController.getDoctorPatients);
router.get('/:id/schedule', idParamValidation, doctorController.getDoctorSchedule);
router.post('/:id/schedule', idParamValidation, authorize('ADMIN'), doctorController.updateDoctorSchedule);
router.get('/:id/available-slots', idParamValidation, doctorController.getAvailableSlots);

module.exports = router;
