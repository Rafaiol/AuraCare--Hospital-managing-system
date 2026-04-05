/**
 * Billing Controller
 * Handles invoices, payments, and billing management
 */
const { executeQuery, executeQueryWithPagination } = require('../config/database');
const { APIError, asyncHandler } = require('../middlewares/errorHandler');

/**
 * @desc    Get all invoices with pagination and filtering
 * @route   GET /api/billing/invoices
 * @access  Private
 */
const getInvoices = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    patientId = '',
    status = '',
    dateFrom = '',
    dateTo = '',
    sortBy = 'ISSUE_DATE',
    sortOrder = 'DESC'
  } = req.query;

  let baseQuery = `
    SELECT 
      I.INVOICE_ID, I.INVOICE_NUMBER, I.ISSUE_DATE, I.DUE_DATE,
      I.SUBTOTAL, I.TAX_AMOUNT, I.DISCOUNT_AMOUNT, I.TOTAL_AMOUNT,
      I.PAID_AMOUNT, I.BALANCE_AMOUNT, I.STATUS, I.NOTES,
      I.CREATED_AT, I.UPDATED_AT,
      P.PATIENT_ID, P.PATIENT_CODE, P.FIRST_NAME || ' ' || P.LAST_NAME as PATIENT_NAME,
      P.PHONE as PATIENT_PHONE,
      A.APPOINTMENT_ID, A.APPOINTMENT_CODE,
      U.FIRST_NAME || ' ' || U.LAST_NAME as CREATED_BY_NAME
    FROM INVOICES I
    JOIN PATIENTS P ON I.PATIENT_ID = P.PATIENT_ID
    LEFT JOIN APPOINTMENTS A ON I.APPOINTMENT_ID = A.APPOINTMENT_ID
    LEFT JOIN USERS U ON I.CREATED_BY = U.USER_ID
    WHERE 1=1
  `;

  const params = [];
  let paramIndex = 1;

  if (patientId) {
    baseQuery += ` AND I.PATIENT_ID = $${paramIndex++}`;
    params.push(parseInt(patientId));
  }

  if (status) {
    baseQuery += ` AND I.STATUS = $${paramIndex++}`;
    params.push(status.toUpperCase());
  }

  if (dateFrom) {
    baseQuery += ` AND I.ISSUE_DATE::date >= $${paramIndex++}::date`;
    params.push(dateFrom);
  }

  if (dateTo) {
    baseQuery += ` AND I.ISSUE_DATE::date <= $${paramIndex++}::date`;
    params.push(dateTo);
  }

  const allowedSortColumns = ['ISSUE_DATE', 'DUE_DATE', 'TOTAL_AMOUNT', 'STATUS', 'CREATED_AT'];
  const orderBy = allowedSortColumns.includes(sortBy.toUpperCase()) ? sortBy.toUpperCase() : 'ISSUE_DATE';
  const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  baseQuery += ` ORDER BY I.${orderBy} ${order}`;

  const result = await executeQueryWithPagination(baseQuery, params, parseInt(page), parseInt(limit));

  const invoices = result.data.map(row => ({
    invoiceId: row.INVOICE_ID,
    invoiceNumber: row.INVOICE_NUMBER,
    issueDate: row.ISSUE_DATE,
    dueDate: row.DUE_DATE,
    amounts: {
      subtotal: row.SUBTOTAL,
      tax: row.TAX_AMOUNT,
      discount: row.DISCOUNT_AMOUNT,
      total: row.TOTAL_AMOUNT,
      paid: row.PAID_AMOUNT,
      balance: row.BALANCE_AMOUNT
    },
    status: row.STATUS,
    notes: row.NOTES,
    patient: {
      patientId: row.PATIENT_ID,
      patientCode: row.PATIENT_CODE,
      name: row.PATIENT_NAME,
      phone: row.PATIENT_PHONE
    },
    appointment: row.APPOINTMENT_ID ? {
      appointmentId: row.APPOINTMENT_ID,
      appointmentCode: row.APPOINTMENT_CODE
    } : null,
    createdBy: row.CREATED_BY_NAME,
    createdAt: row.CREATED_AT,
    updatedAt: row.UPDATED_AT
  }));

  res.json({
    success: true,
    data: invoices,
    pagination: result.pagination
  });
});

/**
 * @desc    Get single invoice by ID with items
 * @route   GET /api/billing/invoices/:id
 * @access  Private
 */
const getInvoiceById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const invoiceResult = await executeQuery(
    `SELECT 
      I.*,
      P.PATIENT_ID, P.PATIENT_CODE, P.FIRST_NAME || ' ' || P.LAST_NAME as PATIENT_NAME,
      P.PHONE as PATIENT_PHONE, P.EMAIL as PATIENT_EMAIL, P.ADDRESS as PATIENT_ADDRESS,
      A.APPOINTMENT_ID, A.APPOINTMENT_CODE,
      U.FIRST_NAME || ' ' || U.LAST_NAME as CREATED_BY_NAME
    FROM INVOICES I
    JOIN PATIENTS P ON I.PATIENT_ID = P.PATIENT_ID
    LEFT JOIN APPOINTMENTS A ON I.APPOINTMENT_ID = A.APPOINTMENT_ID
    LEFT JOIN USERS U ON I.CREATED_BY = U.USER_ID
    WHERE I.INVOICE_ID = $1`,
    [parseInt(id)]
  );

  if (invoiceResult.rows.length === 0) {
    throw new APIError('Invoice not found', 404, 'INVOICE_NOT_FOUND');
  }

  const row = invoiceResult.rows[0];

  // Get invoice items
  const itemsResult = await executeQuery(
    `SELECT * FROM INVOICE_ITEMS WHERE INVOICE_ID = $1 ORDER BY ITEM_ID`,
    [parseInt(id)]
  );

  // Get payments
  const paymentsResult = await executeQuery(
    `SELECT 
      PAY.*,
      U.FIRST_NAME || ' ' || U.LAST_NAME as CREATED_BY_NAME
     FROM BILLING_PAYMENTS PAY
     LEFT JOIN USERS U ON PAY.CREATED_BY = U.USER_ID
     WHERE PAY.INVOICE_ID = $1
     ORDER BY PAY.PAYMENT_DATE DESC`,
    [parseInt(id)]
  );

  const invoice = {
    invoiceId: row.INVOICE_ID,
    invoiceNumber: row.INVOICE_NUMBER,
    issueDate: row.ISSUE_DATE,
    dueDate: row.DUE_DATE,
    amounts: {
      subtotal: row.SUBTOTAL,
      tax: row.TAX_AMOUNT,
      discount: row.DISCOUNT_AMOUNT,
      total: row.TOTAL_AMOUNT,
      paid: row.PAID_AMOUNT,
      balance: row.BALANCE_AMOUNT
    },
    status: row.STATUS,
    notes: row.NOTES,
    patient: {
      patientId: row.PATIENT_ID,
      patientCode: row.PATIENT_CODE,
      name: row.PATIENT_NAME,
      phone: row.PATIENT_PHONE,
      email: row.PATIENT_EMAIL,
      address: row.PATIENT_ADDRESS
    },
    appointment: row.APPOINTMENT_ID ? {
      appointmentId: row.APPOINTMENT_ID,
      appointmentCode: row.APPOINTMENT_CODE
    } : null,
    items: itemsResult.rows.map(item => ({
      itemId: item.ITEM_ID,
      itemType: item.ITEM_TYPE,
      description: item.DESCRIPTION,
      quantity: item.QUANTITY,
      unitPrice: item.UNIT_PRICE,
      totalPrice: item.TOTAL_PRICE
    })),
    payments: paymentsResult.rows.map(payment => ({
      paymentId: payment.PAYMENT_ID,
      paymentDate: payment.PAYMENT_DATE,
      amount: payment.PAYMENT_AMOUNT,
      method: payment.PAYMENT_METHOD,
      transactionId: payment.TRANSACTION_ID,
      notes: payment.NOTES,
      createdBy: payment.CREATED_BY_NAME
    })),
    createdBy: row.CREATED_BY_NAME,
    createdAt: row.CREATED_AT,
    updatedAt: row.UPDATED_AT
  };

  res.json({
    success: true,
    data: invoice
  });
});

/**
 * @desc    Create new invoice
 * @route   POST /api/billing/invoices
 * @access  Private
 */
const createInvoice = asyncHandler(async (req, res) => {
  const {
    patientId,
    appointmentId,
    dueDate,
    taxPercent = 0,
    discountAmount = 0,
    notes,
    items
  } = req.body;

  const createdBy = req.user.userId;

  if (!patientId) throw new APIError('patientId is required', 400, 'MISSING_PATIENT');
  if (!items || items.length === 0) throw new APIError('At least one line item is required', 400, 'MISSING_ITEMS');
  if (!dueDate) throw new APIError('dueDate is required', 400, 'MISSING_DUE_DATE');

  // Calculate totals
  let subtotal = 0;
  for (const item of items) {
    subtotal += Number(item.quantity || 1) * Number(item.unitPrice || 0);
  }
  const taxAmount = (subtotal * Number(taxPercent)) / 100;
  const totalAmount = subtotal + taxAmount - Number(discountAmount);

  // Generate unique invoice number
  const countResult = await executeQuery(`SELECT COUNT(*) as cnt FROM INVOICES`);
  const seqNum = (parseInt(countResult.rows[0].cnt || countResult.rows[0].CNT || 0) + 1).toString().padStart(6, '0');
  const invoiceNumber = `INV-${new Date().getFullYear()}-${seqNum}`;

  // Insert invoice
  const invoiceResult = await executeQuery(
    `INSERT INTO INVOICES (
      INVOICE_NUMBER, PATIENT_ID, APPOINTMENT_ID, ISSUE_DATE, DUE_DATE,
      SUBTOTAL, TAX_AMOUNT, DISCOUNT_AMOUNT, TOTAL_AMOUNT,
      PAID_AMOUNT, BALANCE_AMOUNT, STATUS, NOTES, CREATED_BY
    ) VALUES (
      $1, $2, $3, CURRENT_TIMESTAMP,
      $4::date,
      $5, $6, $7, $8,
      0, $8, 'PENDING', $9, $10
    ) RETURNING INVOICE_ID`,
    [
      invoiceNumber,
      parseInt(patientId),
      appointmentId ? parseInt(appointmentId) : null,
      dueDate,
      subtotal,
      taxAmount,
      Number(discountAmount),
      totalAmount,
      notes || null,
      createdBy
    ]
  );

  const invoiceId = invoiceResult.rows[0].INVOICE_ID;

  // Insert invoice items
  for (const item of items) {
    const qty = Number(item.quantity || 1);
    const price = Number(item.unitPrice || 0);
    await executeQuery(
      `INSERT INTO INVOICE_ITEMS (
        INVOICE_ID, ITEM_TYPE, DESCRIPTION, QUANTITY, UNIT_PRICE, TOTAL_PRICE
      ) VALUES (
        $1, $2, $3, $4, $5, $6
      )`,
      [
        invoiceId,
        item.itemType || 'OTHER',
        item.description,
        qty,
        price,
        qty * price
      ]
    );
  }

  res.status(201).json({
    success: true,
    message: 'Invoice created successfully',
    data: { invoiceId, invoiceNumber }
  });
});

/**
 * @desc    Process payment for invoice
 * @route   POST /api/billing/payments
 * @access  Private
 */
const processPayment = asyncHandler(async (req, res) => {
  const {
    invoiceId,
    paymentAmount,
    paymentMethod,
    transactionId,
    notes
  } = req.body;

  const createdBy = req.user.userId;

  // Check invoice exists and has balance
  const invoiceCheck = await executeQuery(
    `SELECT BALANCE_AMOUNT, STATUS FROM INVOICES WHERE INVOICE_ID = $1`,
    [parseInt(invoiceId)]
  );

  if (invoiceCheck.rows.length === 0) {
    throw new APIError('Invoice not found', 404, 'INVOICE_NOT_FOUND');
  }

  const balance = invoiceCheck.rows[0].BALANCE_AMOUNT;
  const status = invoiceCheck.rows[0].STATUS;

  if (status === 'PAID') {
    throw new APIError('Invoice is already fully paid', 400, 'INVOICE_PAID');
  }

  if (paymentAmount > balance) {
    throw new APIError(`Payment amount exceeds balance of ${balance}`, 400, 'PAYMENT_EXCEEDS_BALANCE');
  }

  // Instead of Oracle SP_PROCESS_PAYMENT, perform the transaction inline for Postgres
  // Assuming basic transaction of updating invoice and recording payment:
  const paymentResult = await executeQuery(
    `INSERT INTO BILLING_PAYMENTS (
      INVOICE_ID, PAYMENT_DATE, PAYMENT_AMOUNT, PAYMENT_METHOD, TRANSACTION_ID, CREATED_BY, NOTES
    ) VALUES (
      $1, CURRENT_TIMESTAMP, $2, $3, $4, $5, $6
    ) RETURNING PAYMENT_ID`,
    [parseInt(invoiceId), parseFloat(paymentAmount), paymentMethod, transactionId || null, createdBy, notes || null]
  );

  const paymentId = paymentResult.rows[0].PAYMENT_ID;
  const newBalance = balance - parseFloat(paymentAmount);
  const newStatus = newBalance <= 0 ? 'PAID' : 'PARTIAL';

  await executeQuery(
    `UPDATE INVOICES SET PAID_AMOUNT = PAID_AMOUNT + $1, BALANCE_AMOUNT = $2, STATUS = $3 WHERE INVOICE_ID = $4`,
    [parseFloat(paymentAmount), newBalance, newStatus, parseInt(invoiceId)]
  );

  res.status(201).json({
    success: true,
    message: 'Payment processed successfully',
    data: {
      paymentId: paymentId
    }
  });
});

/**
 * @desc    Get payment history
 * @route   GET /api/billing/payments
 * @access  Private
 */
const getPayments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, invoiceId = '', patientId = '' } = req.query;

  let baseQuery = `
    SELECT 
      PAY.PAYMENT_ID, PAY.PAYMENT_DATE, PAY.PAYMENT_AMOUNT, PAY.PAYMENT_METHOD,
      PAY.TRANSACTION_ID, PAY.NOTES, PAY.CREATED_AT,
      I.INVOICE_ID, I.INVOICE_NUMBER,
      P.PATIENT_ID, P.PATIENT_CODE, P.FIRST_NAME || ' ' || P.LAST_NAME as PATIENT_NAME,
      U.FIRST_NAME || ' ' || U.LAST_NAME as CREATED_BY_NAME
    FROM BILLING_PAYMENTS PAY
    JOIN INVOICES I ON PAY.INVOICE_ID = I.INVOICE_ID
    JOIN PATIENTS P ON I.PATIENT_ID = P.PATIENT_ID
    LEFT JOIN USERS U ON PAY.CREATED_BY = U.USER_ID
    WHERE 1=1
  `;

  const params = [];
  let paramIndex = 1;

  if (invoiceId) {
    baseQuery += ` AND PAY.INVOICE_ID = $${paramIndex++}`;
    params.push(parseInt(invoiceId));
  }

  if (patientId) {
    baseQuery += ` AND I.PATIENT_ID = $${paramIndex++}`;
    params.push(parseInt(patientId));
  }

  baseQuery += ` ORDER BY PAY.PAYMENT_DATE DESC`;

  const result = await executeQueryWithPagination(baseQuery, params, parseInt(page), parseInt(limit));

  const payments = result.data.map(row => ({
    paymentId: row.PAYMENT_ID,
    paymentDate: row.PAYMENT_DATE,
    amount: row.PAYMENT_AMOUNT,
    method: row.PAYMENT_METHOD,
    transactionId: row.TRANSACTION_ID,
    notes: row.NOTES,
    invoice: {
      invoiceId: row.INVOICE_ID,
      invoiceNumber: row.INVOICE_NUMBER
    },
    patient: {
      patientId: row.PATIENT_ID,
      patientCode: row.PATIENT_CODE,
      name: row.PATIENT_NAME
    },
    createdBy: row.CREATED_BY_NAME,
    createdAt: row.CREATED_AT
  }));

  res.json({
    success: true,
    data: payments,
    pagination: result.pagination
  });
});

/**
 * @desc    Get billing statistics
 * @route   GET /api/billing/statistics
 * @access  Private
 */
const getBillingStatistics = asyncHandler(async (req, res) => {
  const { dateFrom, dateTo } = req.query;

  let dateFilterInvoice = 'WHERE 1=1';
  let dateFilterPayment = 'WHERE 1=1';
  const params = [];

  if (dateFrom && dateTo) {
    dateFilterInvoice += ` AND ISSUE_DATE::date BETWEEN $1::date AND $2::date`;
    dateFilterPayment += ` AND PAYMENT_DATE::date BETWEEN $1::date AND $2::date`;
    params.push(dateFrom, dateTo);
  }

  const statsResult = await executeQuery(
    `SELECT 
      COUNT(*) as total_invoices,
      COALESCE(SUM(TOTAL_AMOUNT), 0) as total_amount,
      COALESCE(SUM(PAID_AMOUNT), 0) as total_paid,
      COALESCE(SUM(BALANCE_AMOUNT), 0) as total_balance,
      COUNT(CASE WHEN STATUS = 'PAID' THEN 1 END) as paid_count,
      COUNT(CASE WHEN STATUS = 'PENDING' THEN 1 END) as pending_count,
      COUNT(CASE WHEN STATUS = 'OVERDUE' THEN 1 END) as overdue_count,
      COUNT(CASE WHEN STATUS = 'PARTIAL' THEN 1 END) as partial_count
     FROM INVOICES
     ${dateFilterInvoice}`,
    params
  );

  const paymentMethodResult = await executeQuery(
    `SELECT 
      PAYMENT_METHOD,
      COUNT(*) as count,
      COALESCE(SUM(PAYMENT_AMOUNT), 0) as total
     FROM BILLING_PAYMENTS
     ${dateFilterPayment}
     GROUP BY PAYMENT_METHOD`,
    params
  );

  res.json({
    success: true,
    data: {
      invoiceStats: statsResult.rows[0],
      paymentMethods: paymentMethodResult.rows.map(row => ({
        method: row.PAYMENT_METHOD,
        count: row.COUNT,
        total: row.TOTAL
      }))
    }
  });
});

module.exports = {
  getInvoices,
  getInvoiceById,
  createInvoice,
  processPayment,
  getPayments,
  getBillingStatistics
};
