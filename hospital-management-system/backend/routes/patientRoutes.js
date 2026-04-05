/**
 * Patient Routes
 */
const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { authenticate, authorize } = require('../middlewares/auth');
const { paginationValidation, patientCreateValidation, patientUpdateValidation, idParamValidation } = require('../middlewares/validation');

router.use(authenticate);

// Main CRUD routes
router.get('/', paginationValidation, patientController.getPatients);
router.post('/', patientCreateValidation, patientController.createPatient);
router.get('/:id', idParamValidation, patientController.getPatientById);
router.put('/:id', idParamValidation, patientUpdateValidation, patientController.updatePatient);
router.delete('/:id', idParamValidation, authorize('ADMIN'), patientController.deletePatient);

// Related data routes
router.get('/:id/medical-history', idParamValidation, paginationValidation, patientController.getMedicalHistory);
router.post('/:id/medical-history', idParamValidation, authorize('DOCTOR', 'ADMIN'), patientController.addMedicalHistory);
router.get('/:id/appointments', idParamValidation, paginationValidation, patientController.getPatientAppointments);

module.exports = router;
