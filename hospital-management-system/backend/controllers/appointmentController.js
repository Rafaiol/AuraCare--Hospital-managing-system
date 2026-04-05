/**
 * Appointment Controller
 * Handles appointment booking, scheduling, and management
 */
const { executeQuery, executeQueryWithPagination } = require('../config/database');
const { APIError, asyncHandler } = require('../middlewares/errorHandler');
const { createNotification } = require('./notificationController');

/**
 * @desc    Get all appointments with pagination and filtering
 * @route   GET /api/appointments
 * @access  Private
 */
const getAppointments = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    patientId = '',
    doctorId = '',
    status = '',
    dateFrom = '',
    dateTo = '',
    type = '',
    sortBy = 'APPOINTMENT_DATE',
    sortOrder = 'DESC'
  } = req.query;

  let baseQuery = `
    SELECT 
      A.APPOINTMENT_ID, A.APPOINTMENT_CODE, A.APPOINTMENT_DATE, A.APPOINTMENT_TIME,
      A.DURATION, A.TYPE, A.STATUS, A.REASON, A.NOTES,
      A.CREATED_AT, A.UPDATED_AT,
      P.PATIENT_ID, P.PATIENT_CODE, P.FIRST_NAME || ' ' || P.LAST_NAME as PATIENT_NAME,
      P.PHONE as PATIENT_PHONE, P.GENDER as PATIENT_GENDER,
      D.DOCTOR_ID, U.FIRST_NAME || ' ' || U.LAST_NAME as DOCTOR_NAME,
      D.SPECIALIZATION as DOCTOR_SPECIALIZATION,
      DEPT.DEPT_NAME
    FROM APPOINTMENTS A
    JOIN PATIENTS P ON A.PATIENT_ID = P.PATIENT_ID
    JOIN DOCTORS D ON A.DOCTOR_ID = D.DOCTOR_ID
    JOIN USERS U ON D.USER_ID = U.USER_ID
    LEFT JOIN DEPARTMENTS DEPT ON D.DEPT_ID = DEPT.DEPT_ID
    WHERE 1=1
  `;

  const params = [];
  let paramIndex = 1;

  if (patientId) {
    baseQuery += ` AND A.PATIENT_ID = $${paramIndex++}`;
    params.push(parseInt(patientId));
  }

  if (doctorId) {
    baseQuery += ` AND A.DOCTOR_ID = $${paramIndex++}`;
    params.push(parseInt(doctorId));
  }

  if (status) {
    baseQuery += ` AND A.STATUS = $${paramIndex++}`;
    params.push(status.toUpperCase());
  }

  if (type) {
    baseQuery += ` AND A.TYPE = $${paramIndex++}`;
    params.push(type.toUpperCase());
  }

  if (dateFrom) {
    baseQuery += ` AND A.APPOINTMENT_DATE::date >= $${paramIndex++}::date`;
    params.push(dateFrom);
  }

  if (dateTo) {
    baseQuery += ` AND A.APPOINTMENT_DATE::date <= $${paramIndex++}::date`;
    params.push(dateTo);
  }

  const allowedSortColumns = ['APPOINTMENT_DATE', 'CREATED_AT', 'STATUS'];
  const orderBy = allowedSortColumns.includes(sortBy.toUpperCase()) ? sortBy.toUpperCase() : 'APPOINTMENT_DATE';
  const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  baseQuery += ` ORDER BY A.${orderBy} ${order}, A.APPOINTMENT_TIME ${order}`;

  const result = await executeQueryWithPagination(baseQuery, params, parseInt(page), parseInt(limit));

  const appointments = result.data.map(row => ({
    appointmentId: row.APPOINTMENT_ID,
    appointmentCode: row.APPOINTMENT_CODE,
    appointmentDate: row.APPOINTMENT_DATE,
    appointmentTime: row.APPOINTMENT_TIME,
    duration: row.DURATION,
    type: row.TYPE,
    status: row.STATUS,
    reason: row.REASON,
    notes: row.NOTES,
    patient: {
      patientId: row.PATIENT_ID,
      patientCode: row.PATIENT_CODE,
      name: row.PATIENT_NAME,
      phone: row.PATIENT_PHONE,
      gender: row.PATIENT_GENDER
    },
    doctor: {
      doctorId: row.DOCTOR_ID,
      name: row.DOCTOR_NAME,
      specialization: row.DOCTOR_SPECIALIZATION,
      department: row.DEPT_NAME
    },
    createdAt: row.CREATED_AT,
    updatedAt: row.UPDATED_AT
  }));

  res.json({
    success: true,
    data: appointments,
    pagination: result.pagination
  });
});

/**
 * @desc    Get single appointment by ID
 * @route   GET /api/appointments/:id
 * @access  Private
 */
const getAppointmentById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await executeQuery(
    `SELECT 
      A.*,
      P.PATIENT_CODE, P.FIRST_NAME || ' ' || P.LAST_NAME as PATIENT_NAME,
      P.PHONE as PATIENT_PHONE, P.EMAIL as PATIENT_EMAIL, P.GENDER as PATIENT_GENDER,
      D.DOCTOR_ID, U.FIRST_NAME || ' ' || U.LAST_NAME as DOCTOR_NAME,
      D.SPECIALIZATION as DOCTOR_SPECIALIZATION, D.CONSULTATION_FEE,
      DEPT.DEPT_NAME
    FROM APPOINTMENTS A
    JOIN PATIENTS P ON A.PATIENT_ID = P.PATIENT_ID
    JOIN DOCTORS D ON A.DOCTOR_ID = D.DOCTOR_ID
    JOIN USERS U ON D.USER_ID = U.USER_ID
    LEFT JOIN DEPARTMENTS DEPT ON D.DEPT_ID = DEPT.DEPT_ID
    WHERE A.APPOINTMENT_ID = $1`,
    [parseInt(id)]
  );

  if (result.rows.length === 0) {
    throw new APIError('Appointment not found', 404, 'APPOINTMENT_NOT_FOUND');
  }

  const row = result.rows[0];

  const appointment = {
    appointmentId: row.APPOINTMENT_ID,
    appointmentCode: row.APPOINTMENT_CODE,
    appointmentDate: row.APPOINTMENT_DATE,
    appointmentTime: row.APPOINTMENT_TIME,
    duration: row.DURATION,
    type: row.TYPE,
    status: row.STATUS,
    reason: row.REASON,
    notes: row.NOTES,
    patient: {
      patientId: row.PATIENT_ID,
      patientCode: row.PATIENT_CODE,
      name: row.PATIENT_NAME,
      phone: row.PATIENT_PHONE,
      email: row.PATIENT_EMAIL,
      gender: row.PATIENT_GENDER
    },
    doctor: {
      doctorId: row.DOCTOR_ID,
      name: row.DOCTOR_NAME,
      specialization: row.DOCTOR_SPECIALIZATION,
      consultationFee: row.CONSULTATION_FEE,
      department: row.DEPT_NAME
    },
    createdBy: row.CREATED_BY,
    createdAt: row.CREATED_AT,
    updatedAt: row.UPDATED_AT
  };

  res.json({
    success: true,
    data: appointment
  });
});

/**
 * @desc    Create new appointment
 * @route   POST /api/appointments
 * @access  Private
 */
const createAppointment = asyncHandler(async (req, res) => {
  const {
    patientId,
    doctorId,
    appointmentDate,
    appointmentTime,
    type = 'CONSULTATION',
    reason,
    duration = 30
  } = req.body;

  const createdBy = req.user.userId;

  // Instead of Oracle SP_BOOK_APPOINTMENT, replace it with direct insert
  const seqResult = await executeQuery(`SELECT 'APT' || TO_CHAR(CURRENT_TIMESTAMP, 'YYYYMMDD') || '-' || LPAD(nextval('SEQ_APPOINTMENTS')::text, 4, '0') as code`);
  const appointmentCode = seqResult.rows[0].CODE;

  const result = await executeQuery(
    `INSERT INTO APPOINTMENTS (
      APPOINTMENT_CODE, PATIENT_ID, DOCTOR_ID, APPOINTMENT_DATE, APPOINTMENT_TIME,
      DURATION, TYPE, STATUS, REASON, CREATED_BY
    ) VALUES (
      $1, $2, $3, $4::date, $5,
      $6, $7, 'SCHEDULED', $8, $9
    ) RETURNING APPOINTMENT_ID`,
    [
      appointmentCode,
      parseInt(patientId),
      parseInt(doctorId),
      appointmentDate,
      appointmentTime,
      parseInt(duration),
      type,
      reason || null,
      createdBy
    ]
  );

  const appointmentId = result.rows[0].APPOINTMENT_ID;

  // Create Notification for the Doctor
  try {
    const doctorUserResult = await executeQuery('SELECT USER_ID FROM DOCTORS WHERE DOCTOR_ID = $1', [parseInt(doctorId)]);
    const patientNameResult = await executeQuery('SELECT FIRST_NAME, LAST_NAME FROM PATIENTS WHERE PATIENT_ID = $1', [parseInt(patientId)]);
    
    if (doctorUserResult.rows.length > 0 && patientNameResult.rows.length > 0) {
      const pName = `${patientNameResult.rows[0].FIRST_NAME} ${patientNameResult.rows[0].LAST_NAME}`;
      await createNotification({
        userId: doctorUserResult.rows[0].USER_ID,
        title: 'New Appointment',
        message: `A new ${type.toLowerCase()} appointment has been scheduled with ${pName} for ${appointmentDate} at ${appointmentTime}.`,
        type: 'INFO'
      });
    }
  } catch (notificationError) {
    console.error('Failed to create background notification:', notificationError);
  }

  res.status(201).json({
    success: true,
    message: 'Appointment booked successfully',
    data: {
      appointmentId: appointmentId,
      appointmentCode: appointmentCode
    }
  });
});

/**
 * @desc    Update appointment
 * @route   PUT /api/appointments/:id
 * @access  Private
 */
const updateAppointment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const appointmentCheck = await executeQuery(
    'SELECT APPOINTMENT_ID, STATUS FROM APPOINTMENTS WHERE APPOINTMENT_ID = $1',
    [parseInt(id)]
  );

  if (appointmentCheck.rows.length === 0) {
    throw new APIError('Appointment not found', 404, 'APPOINTMENT_NOT_FOUND');
  }

  // Cannot update completed or cancelled appointments
  const currentStatus = appointmentCheck.rows[0].STATUS;
  if (currentStatus === 'COMPLETED' || currentStatus === 'CANCELLED') {
    throw new APIError(
      `Cannot update ${currentStatus.toLowerCase()} appointment`,
      400,
      'APPOINTMENT_FINALIZED'
    );
  }

  const fieldMappings = {
    appointmentDate: 'APPOINTMENT_DATE',
    appointmentTime: 'APPOINTMENT_TIME',
    duration: 'DURATION',
    type: 'TYPE',
    status: 'STATUS',
    reason: 'REASON',
    notes: 'NOTES'
  };

  const updates = [];
  const params = [parseInt(id)];
  let paramIndex = 2;

  for (const [key, value] of Object.entries(updateData)) {
    if (fieldMappings[key] && value !== undefined) {
      if (key === 'appointmentDate') {
        updates.push(`${fieldMappings[key]} = $${paramIndex++}::date`);
      } else if (key === 'type' || key === 'status') {
        updates.push(`${fieldMappings[key]} = $${paramIndex++}`);
        params.push(value.toUpperCase());
        continue;
      } else {
        updates.push(`${fieldMappings[key]} = $${paramIndex++}`);
      }
      params.push(value);
    }
  }

  if (updates.length === 0) {
    throw new APIError('No fields to update', 400, 'NO_UPDATE_FIELDS');
  }

  const updateSql = `UPDATE APPOINTMENTS SET ${updates.join(', ')} WHERE APPOINTMENT_ID = $1`;

  await executeQuery(updateSql, params);

  res.json({
    success: true,
    message: 'Appointment updated successfully'
  });
});

/**
 * @desc    Cancel appointment
 * @route   PUT /api/appointments/:id/cancel
 * @access  Private
 */
const cancelAppointment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { cancellationReason } = req.body;

  const appointmentCheck = await executeQuery(
    'SELECT STATUS FROM APPOINTMENTS WHERE APPOINTMENT_ID = $1',
    [parseInt(id)]
  );

  if (appointmentCheck.rows.length === 0) {
    throw new APIError('Appointment not found', 404, 'APPOINTMENT_NOT_FOUND');
  }

  const currentStatus = appointmentCheck.rows[0].STATUS;
  if (currentStatus === 'COMPLETED' || currentStatus === 'CANCELLED') {
    throw new APIError(
      `Appointment is already ${currentStatus.toLowerCase()}`,
      400,
      'APPOINTMENT_FINALIZED'
    );
  }

  await executeQuery(
    `UPDATE APPOINTMENTS SET STATUS = 'CANCELLED', NOTES = $2 WHERE APPOINTMENT_ID = $1`,
    [
      parseInt(id),
      cancellationReason || 'Cancelled by user'
    ]
  );

  res.json({
    success: true,
    message: 'Appointment cancelled successfully'
  });
});

/**
 * @desc    Complete appointment
 * @route   PUT /api/appointments/:id/complete
 * @access  Private (Doctor only)
 */
const completeAppointment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const appointmentCheck = await executeQuery(
    'SELECT STATUS FROM APPOINTMENTS WHERE APPOINTMENT_ID = $1',
    [parseInt(id)]
  );

  if (appointmentCheck.rows.length === 0) {
    throw new APIError('Appointment not found', 404, 'APPOINTMENT_NOT_FOUND');
  }

  const currentStatus = appointmentCheck.rows[0].STATUS;
  if (currentStatus === 'COMPLETED') {
    throw new APIError('Appointment is already completed', 400, 'ALREADY_COMPLETED');
  }

  if (currentStatus === 'CANCELLED') {
    throw new APIError('Cannot complete cancelled appointment', 400, 'APPOINTMENT_CANCELLED');
  }

  await executeQuery(
    `UPDATE APPOINTMENTS SET STATUS = 'COMPLETED' WHERE APPOINTMENT_ID = $1`,
    [parseInt(id)]
  );

  res.json({
    success: true,
    message: 'Appointment marked as completed'
  });
});

/**
 * @desc    Delete appointment
 * @route   DELETE /api/appointments/:id
 * @access  Private (Admin only)
 */
const deleteAppointment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const appointmentCheck = await executeQuery(
    'SELECT APPOINTMENT_ID FROM APPOINTMENTS WHERE APPOINTMENT_ID = $1',
    [parseInt(id)]
  );

  if (appointmentCheck.rows.length === 0) {
    throw new APIError('Appointment not found', 404, 'APPOINTMENT_NOT_FOUND');
  }

  await executeQuery(
    'DELETE FROM APPOINTMENTS WHERE APPOINTMENT_ID = $1',
    [parseInt(id)]
  );

  res.json({
    success: true,
    message: 'Appointment deleted successfully'
  });
});

/**
 * @desc    Get calendar data for appointments
 * @route   GET /api/appointments/calendar
 * @access  Private
 */
const getCalendarData = asyncHandler(async (req, res) => {
  const { doctorId, month, year } = req.query;

  if (!month || !year) {
    throw new APIError('Month and year are required', 400, 'MISSING_PARAMS');
  }

  let query = `
    SELECT 
      A.APPOINTMENT_ID,
      A.APPOINTMENT_DATE,
      A.APPOINTMENT_TIME,
      A.STATUS,
      A.TYPE,
      P.FIRST_NAME || ' ' || P.LAST_NAME as PATIENT_NAME
    FROM APPOINTMENTS A
    JOIN PATIENTS P ON A.PATIENT_ID = P.PATIENT_ID
    WHERE EXTRACT(MONTH FROM A.APPOINTMENT_DATE) = $1
    AND EXTRACT(YEAR FROM A.APPOINTMENT_DATE) = $2
  `;

  const params = [
    parseInt(month),
    parseInt(year)
  ];
  let paramIndex = 3;

  if (doctorId) {
    query += ` AND A.DOCTOR_ID = $${paramIndex++}`;
    params.push(parseInt(doctorId));
  }

  query += ` ORDER BY A.APPOINTMENT_DATE, A.APPOINTMENT_TIME`;

  const result = await executeQuery(query, params);

  const calendarData = result.rows.map(row => ({
    appointmentId: row.APPOINTMENT_ID,
    date: row.APPOINTMENT_DATE,
    time: row.APPOINTMENT_TIME,
    status: row.STATUS,
    type: row.TYPE,
    patientName: row.PATIENT_NAME
  }));

  res.json({
    success: true,
    data: calendarData
  });
});

/**
 * @desc    Get appointment statistics
 * @route   GET /api/appointments/statistics
 * @access  Private
 */
const getAppointmentStatistics = asyncHandler(async (req, res) => {
  const { dateFrom, dateTo } = req.query;

  let dateFilter = 'WHERE 1=1';
  const params = [];

  if (dateFrom && dateTo) {
    dateFilter += ` AND APPOINTMENT_DATE::date BETWEEN $1::date AND $2::date`;
    params.push(dateFrom, dateTo);
  }

  const statsResult = await executeQuery(
    `SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN STATUS = 'SCHEDULED' THEN 1 END) as scheduled,
      COUNT(CASE WHEN STATUS = 'CONFIRMED' THEN 1 END) as confirmed,
      COUNT(CASE WHEN STATUS = 'COMPLETED' THEN 1 END) as completed,
      COUNT(CASE WHEN STATUS = 'CANCELLED' THEN 1 END) as cancelled,
      COUNT(CASE WHEN STATUS = 'NO_SHOW' THEN 1 END) as no_show
     FROM APPOINTMENTS
     ${dateFilter}`,
    params
  );

  const typeResult = await executeQuery(
    `SELECT 
      TYPE,
      COUNT(*) as count
     FROM APPOINTMENTS
     ${dateFilter}
     GROUP BY TYPE`,
    params
  );

  res.json({
    success: true,
    data: {
      overall: statsResult.rows[0] ? {
        total: parseInt(statsResult.rows[0].TOTAL) || 0,
        scheduled: parseInt(statsResult.rows[0].SCHEDULED) || 0,
        confirmed: parseInt(statsResult.rows[0].CONFIRMED) || 0,
        completed: parseInt(statsResult.rows[0].COMPLETED) || 0,
        cancelled: parseInt(statsResult.rows[0].CANCELLED) || 0,
        no_show: parseInt(statsResult.rows[0].NO_SHOW) || 0,
      } : {
        total: 0, scheduled: 0, confirmed: 0, completed: 0, cancelled: 0, no_show: 0
      },
      byType: typeResult.rows.map(row => ({
        type: row.TYPE,
        count: parseInt(row.COUNT) || 0
      }))
    }
  });
});

module.exports = {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  completeAppointment,
  deleteAppointment,
  getCalendarData,
  getAppointmentStatistics
};
