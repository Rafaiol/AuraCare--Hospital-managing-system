/**
 * Report Routes
 */
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/summary', reportController.getSummaryReport);
router.get('/patients', reportController.getPatientReport);
router.get('/appointments', reportController.getAppointmentReport);
router.get('/revenue', reportController.getRevenueReport);
router.get('/doctors', reportController.getDoctorReport);
router.get('/bed-occupancy', reportController.getBedOccupancyReport);

module.exports = router;
