/**
 * Billing Routes
 */
const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const { authenticate, authorize } = require('../middlewares/auth');
const { paginationValidation, invoiceCreateValidation, paymentCreateValidation } = require('../middlewares/validation');

router.use(authenticate);

// Invoice routes
router.get('/invoices', paginationValidation, billingController.getInvoices);
router.post('/invoices', invoiceCreateValidation, authorize('RECEPTIONIST', 'ADMIN'), billingController.createInvoice);
router.get('/invoices/:id', billingController.getInvoiceById);

// Payment routes
router.get('/payments', paginationValidation, billingController.getPayments);
router.post('/payments', paymentCreateValidation, authorize('RECEPTIONIST', 'ADMIN'), billingController.processPayment);

// Statistics
router.get('/statistics', billingController.getBillingStatistics);

module.exports = router;
