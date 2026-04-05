/**
 * Dashboard Routes
 */
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middlewares/auth');

router.use(authenticate);

router.get('/stats', dashboardController.getDashboardStats);
router.get('/appointments-chart', dashboardController.getAppointmentsChart);
router.get('/revenue-chart', dashboardController.getRevenueChart);
router.get('/patients-by-department', dashboardController.getPatientsByDepartment);
router.get('/doctor-performance', dashboardController.getDoctorPerformance);
router.get('/today-appointments', dashboardController.getTodayAppointments);
router.get('/recent-activities', dashboardController.getRecentActivities);

module.exports = router;
