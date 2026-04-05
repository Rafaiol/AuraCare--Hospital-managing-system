/**
 * Input Validation Middleware
 * Uses express-validator for request validation
 */
const { body, param, query, validationResult } = require('express-validator');

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.error('Validation failed for', req.path, '\nBody:', req.body, '\nErrors:', errors.array());
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }

  next();
};

// Auth Validations
const loginValidation = [
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidationErrors
];

const registerValidation = [
  body('username')
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName')
    .notEmpty().withMessage('First name is required')
    .isLength({ max: 50 }).withMessage('First name must not exceed 50 characters'),
  body('lastName')
    .notEmpty().withMessage('Last name is required')
    .isLength({ max: 50 }).withMessage('Last name must not exceed 50 characters'),
  body('roleId')
    .optional()
    .isInt({ min: 1 }).withMessage('Invalid role ID'),
  handleValidationErrors
];

// Patient Validations
const patientCreateValidation = [
  body('firstName')
    .notEmpty().withMessage('First name is required')
    .isLength({ max: 50 }).withMessage('First name must not exceed 50 characters'),
  body('lastName')
    .notEmpty().withMessage('Last name is required')
    .isLength({ max: 50 }).withMessage('Last name must not exceed 50 characters'),
  body('dateOfBirth')
    .notEmpty().withMessage('Date of birth is required')
    .isISO8601().withMessage('Invalid date format'),
  body('gender')
    .notEmpty().withMessage('Gender is required')
    .isIn(['MALE', 'FEMALE', 'OTHER']).withMessage('Gender must be MALE, FEMALE, or OTHER'),
  body('phone')
    .notEmpty().withMessage('Phone number is required')
    .matches(/^\+?[\d\s-()]+$/).withMessage('Invalid phone number format'),
  body('email')
    .optional({ checkFalsy: true })
    .isEmail().withMessage('Invalid email format'),
  body('bloodGroup')
    .optional({ checkFalsy: true })
    .toUpperCase()
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Invalid blood group'),
  body('assignedDoctorId')
    .optional({ checkFalsy: true })
    .isInt({ min: 1 }).withMessage('Invalid doctor ID'),
  handleValidationErrors
];

const patientUpdateValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('Invalid patient ID'),
  body('firstName')
    .optional()
    .isLength({ max: 50 }).withMessage('First name must not exceed 50 characters'),
  body('lastName')
    .optional()
    .isLength({ max: 50 }).withMessage('Last name must not exceed 50 characters'),
  body('email')
    .optional({ checkFalsy: true })
    .isEmail().withMessage('Invalid email format'),
  body('phone')
    .optional({ checkFalsy: true })
    .matches(/^\+?[\d\s-()]+$/).withMessage('Invalid phone number format'),
  handleValidationErrors
];

// Doctor Validations
const doctorCreateValidation = [
  body('firstName')
    .notEmpty().withMessage('First name is required'),
  body('lastName')
    .notEmpty().withMessage('Last name is required'),
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format'),
  body('specialization')
    .notEmpty().withMessage('Specialization is required'),
  handleValidationErrors
];

// Appointment Validations
const appointmentCreateValidation = [
  body('patientId')
    .notEmpty().withMessage('Patient ID is required')
    .isInt({ min: 1 }).withMessage('Invalid patient ID'),
  body('doctorId')
    .notEmpty().withMessage('Doctor ID is required')
    .isInt({ min: 1 }).withMessage('Invalid doctor ID'),
  body('appointmentDate')
    .notEmpty().withMessage('Appointment date is required')
    .isISO8601().withMessage('Invalid date format'),
  body('appointmentTime')
    .notEmpty().withMessage('Appointment time is required')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format (HH:MM)'),
  body('type')
    .optional()
    .isIn(['CONSULTATION', 'FOLLOW_UP', 'EMERGENCY', 'SURGERY', 'CHECKUP']).withMessage('Invalid appointment type'),
  handleValidationErrors
];

// Billing Validations
const invoiceCreateValidation = [
  body('patientId')
    .notEmpty().withMessage('Patient ID is required')
    .isInt({ min: 1 }).withMessage('Invalid patient ID'),
  body('dueDate')
    .notEmpty().withMessage('Due date is required')
    .isISO8601().withMessage('Invalid date format'),
  body('items')
    .isArray({ min: 1 }).withMessage('At least one invoice item is required'),
  body('items.*.itemType')
    .notEmpty().withMessage('Item type is required')
    .isIn(['CONSULTATION', 'PROCEDURE', 'MEDICATION', 'ROOM_CHARGE', 'LAB_TEST', 'OTHER']).withMessage('Invalid item type'),
  body('items.*.description')
    .notEmpty().withMessage('Item description is required'),
  body('items.*.quantity')
    .optional()
    .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.unitPrice')
    .notEmpty().withMessage('Unit price is required')
    .isFloat({ min: 0 }).withMessage('Unit price must be a positive number'),
  handleValidationErrors
];

const paymentCreateValidation = [
  body('invoiceId')
    .notEmpty().withMessage('Invoice ID is required')
    .isInt({ min: 1 }).withMessage('Invalid invoice ID'),
  body('paymentAmount')
    .notEmpty().withMessage('Payment amount is required')
    .isFloat({ min: 0.01 }).withMessage('Payment amount must be greater than 0'),
  body('paymentMethod')
    .notEmpty().withMessage('Payment method is required')
    .isIn(['CASH', 'CARD', 'CHECK', 'BANK_TRANSFER', 'INSURANCE', 'ONLINE']).withMessage('Invalid payment method'),
  handleValidationErrors
];

// Pagination Validation
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000'),
  query('sortBy')
    .optional()
    .isString().withMessage('Sort by must be a string'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
  handleValidationErrors
];

// ID Parameter Validation
const idParamValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('Invalid ID parameter'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  loginValidation,
  registerValidation,
  patientCreateValidation,
  patientUpdateValidation,
  doctorCreateValidation,
  appointmentCreateValidation,
  invoiceCreateValidation,
  paymentCreateValidation,
  paginationValidation,
  idParamValidation
};
