/**
 * Authentication Routes
 */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, authorize } = require('../middlewares/auth');
const { loginValidation, registerValidation } = require('../middlewares/validation');

// Public routes
router.post('/login', loginValidation, authController.login);
router.post('/register', registerValidation, authController.register);
router.post('/refresh', authController.refreshToken);

// Protected routes
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);
router.post('/change-password', authenticate, authController.changePassword);
router.post('/logout', authenticate, authController.logout);

// Admin only routes
router.get('/users', authenticate, authorize('ADMIN'), authController.getUsers);
router.put('/users/:id', authenticate, authorize('ADMIN'), authController.updateUserRole);
router.put('/users/:id/info', authenticate, authorize('ADMIN'), authController.updateUserInfo);

module.exports = router;
