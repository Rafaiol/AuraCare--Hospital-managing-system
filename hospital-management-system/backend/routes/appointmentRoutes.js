/**
 * Appointment Routes
 */
const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { authenticate, authorize } = require('../middlewares/auth');
const { paginationValidation, appointmentCreateValidation, idParamValidation } = require('../middlewares/validation');

router.use(authenticate);

// Main CRUD routes
router.get('/', paginationValidation, appointmentController.getAppointments);
router.post('/', appointmentCreateValidation, appointmentController.createAppointment);
router.get('/calendar', appointmentController.getCalendarData);
router.get('/statistics', appointmentController.getAppointmentStatistics);
router.get('/:id', idParamValidation, appointmentController.getAppointmentById);
router.put('/:id', idParamValidation, appointmentController.updateAppointment);
router.delete('/:id', idParamValidation, authorize('ADMIN'), appointmentController.deleteAppointment);

// Status update routes
router.put('/:id/cancel', idParamValidation, appointmentController.cancelAppointment);
router.put('/:id/complete', idParamValidation, authorize('DOCTOR', 'ADMIN'), appointmentController.completeAppointment);

module.exports = router;
