/**
 * Doctor Controller
 * Handles doctor management and related operations
 */
const { executeQuery, executeQueryWithPagination } = require('../config/database');
const { APIError, asyncHandler } = require('../middlewares/errorHandler');
const bcrypt = require('bcryptjs');

/**
 * @desc    Get all doctors with pagination and filtering
 * @route   GET /api/doctors
 * @access  Private
 */
const getDoctors = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    specialization = '',
    departmentId = '',
    status = 'ACTIVE',
    sortBy = 'RATING',
    sortOrder = 'DESC'
  } = req.query;

  let baseQuery = `
    SELECT 
      D.DOCTOR_ID, D.EMPLOYEE_ID, D.SPECIALIZATION, D.QUALIFICATION,
      D.EXPERIENCE_YEARS, D.CONSULTATION_FEE, D.LICENSE_NUMBER,
      D.JOINING_DATE, D.STATUS, D.RATING, D.PATIENTS_SEEN, D.BIO,
      D.CREATED_AT, D.UPDATED_AT,
      U.USER_ID, U.USERNAME, U.EMAIL, U.FIRST_NAME, U.LAST_NAME,
      U.PHONE, U.PROFILE_IMAGE,
      DEPT.DEPT_ID, DEPT.DEPT_NAME, DEPT.DEPT_CODE
    FROM DOCTORS D
    JOIN USERS U ON D.USER_ID = U.USER_ID
    LEFT JOIN DEPARTMENTS DEPT ON D.DEPT_ID = DEPT.DEPT_ID
    WHERE 1=1
  `;

  const params = [];
  let paramIndex = 1;

  if (search) {
    baseQuery += ` AND (
      UPPER(U.FIRST_NAME) LIKE UPPER($${paramIndex}) OR 
      UPPER(U.LAST_NAME) LIKE UPPER($${paramIndex}) OR
      UPPER(D.SPECIALIZATION) LIKE UPPER($${paramIndex})
    )`;
    paramIndex++;
    params.push(`%${search}%`);
  }

  if (specialization) {
    baseQuery += ` AND UPPER(D.SPECIALIZATION) = UPPER($${paramIndex++})`;
    params.push(specialization);
  }

  if (departmentId) {
    baseQuery += ` AND D.DEPT_ID = $${paramIndex++}`;
    params.push(parseInt(departmentId));
  }

  if (status) {
    baseQuery += ` AND D.STATUS = $${paramIndex++}`;
    params.push(status.toUpperCase());
  }

  const allowedSortColumns = ['RATING', 'EXPERIENCE_YEARS', 'PATIENTS_SEEN', 'JOINING_DATE', 'CONSULTATION_FEE'];
  const orderBy = allowedSortColumns.includes(sortBy.toUpperCase()) ? sortBy.toUpperCase() : 'RATING';
  const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  baseQuery += ` ORDER BY D.${orderBy} ${order}`;

  const result = await executeQueryWithPagination(baseQuery, params, parseInt(page), parseInt(limit));

  const doctors = result.data.map(row => ({
    doctorId: row.DOCTOR_ID,
    employeeId: row.EMPLOYEE_ID,
    user: {
      userId: row.USER_ID,
      username: row.USERNAME,
      email: row.EMAIL,
      firstName: row.FIRST_NAME,
      lastName: row.LAST_NAME,
      fullName: `${row.FIRST_NAME} ${row.LAST_NAME}`,
      phone: row.PHONE,
      profileImage: row.PROFILE_IMAGE
    },
    specialization: row.SPECIALIZATION,
    qualification: row.QUALIFICATION,
    experienceYears: row.EXPERIENCE_YEARS,
    consultationFee: row.CONSULTATION_FEE,
    licenseNumber: row.LICENSE_NUMBER,
    joiningDate: row.JOINING_DATE,
    status: row.STATUS,
    rating: row.RATING,
    patientsSeen: row.PATIENTS_SEEN,
    bio: row.BIO,
    department: row.DEPT_ID ? {
      deptId: row.DEPT_ID,
      deptName: row.DEPT_NAME,
      deptCode: row.DEPT_CODE
    } : null,
    createdAt: row.CREATED_AT,
    updatedAt: row.UPDATED_AT
  }));

  res.json({
    success: true,
    data: doctors,
    pagination: result.pagination
  });
});

/**
 * @desc    Get single doctor by ID
 * @route   GET /api/doctors/:id
 * @access  Private
 */
const getDoctorById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await executeQuery(
    `SELECT 
      D.*,
      U.USER_ID, U.USERNAME, U.EMAIL, U.FIRST_NAME, U.LAST_NAME,
      U.PHONE, U.PROFILE_IMAGE,
      DEPT.DEPT_ID, DEPT.DEPT_NAME, DEPT.DEPT_CODE
    FROM DOCTORS D
    JOIN USERS U ON D.USER_ID = U.USER_ID
    LEFT JOIN DEPARTMENTS DEPT ON D.DEPT_ID = DEPT.DEPT_ID
    WHERE D.DOCTOR_ID = $1`,
    [parseInt(id)]
  );

  if (result.rows.length === 0) {
    throw new APIError('Doctor not found', 404, 'DOCTOR_NOT_FOUND');
  }

  const row = result.rows[0];

  // Get doctor's schedule
  const scheduleResult = await executeQuery(
    `SELECT * FROM DOCTOR_SCHEDULES 
     WHERE DOCTOR_ID = $1 AND IS_AVAILABLE = 1
     ORDER BY DAY_OF_WEEK`,
    [parseInt(id)]
  );

  const doctor = {
    doctorId: row.DOCTOR_ID,
    employeeId: row.EMPLOYEE_ID,
    user: {
      userId: row.USER_ID,
      username: row.USERNAME,
      email: row.EMAIL,
      firstName: row.FIRST_NAME,
      lastName: row.LAST_NAME,
      fullName: `${row.FIRST_NAME} ${row.LAST_NAME}`,
      phone: row.PHONE,
      profileImage: row.PROFILE_IMAGE
    },
    specialization: row.SPECIALIZATION,
    qualification: row.QUALIFICATION,
    experienceYears: row.EXPERIENCE_YEARS,
    consultationFee: row.CONSULTATION_FEE,
    licenseNumber: row.LICENSE_NUMBER,
    joiningDate: row.JOINING_DATE,
    status: row.STATUS,
    rating: row.RATING,
    patientsSeen: row.PATIENTS_SEEN,
    bio: row.BIO,
    department: row.DEPT_ID ? {
      deptId: row.DEPT_ID,
      deptName: row.DEPT_NAME,
      deptCode: row.DEPT_CODE
    } : null,
    schedule: scheduleResult.rows.map(s => ({
      scheduleId: s.SCHEDULE_ID,
      dayOfWeek: s.DAY_OF_WEEK,
      startTime: s.START_TIME,
      endTime: s.END_TIME,
      slotDuration: s.SLOT_DURATION,
      maxPatients: s.MAX_PATIENTS,
      isAvailable: s.IS_AVAILABLE
    })),
    createdAt: row.CREATED_AT,
    updatedAt: row.UPDATED_AT
  };

  res.json({
    success: true,
    data: doctor
  });
});

/**
 * @desc    Create new doctor
 * @route   POST /api/doctors
 * @access  Private (Admin only)
 */
const createDoctor = asyncHandler(async (req, res) => {
  const {
    userId,
    employeeId,
    specialization,
    departmentId,
    qualification,
    experienceYears,
    consultationFee,
    licenseNumber,
    joiningDate,
    bio,
    // Add frontend fields:
    firstName,
    lastName,
    email,
    phone,
    status
  } = req.body;

  let finalUserId = userId;

  if (!finalUserId && email && firstName && lastName) {
    // Check if email exists
    const emailCheck = await executeQuery('SELECT USER_ID FROM USERS WHERE EMAIL = $1', [email.toLowerCase()]);
    if (emailCheck.rows.length > 0) {
      finalUserId = emailCheck.rows[0].USER_ID;
    } else {
      const passwordHash = await bcrypt.hash('doctor123', 10);
      const roleResult = await executeQuery("SELECT ROLE_ID FROM ROLES WHERE ROLE_NAME = 'DOCTOR'");
      const roleId = roleResult.rows[0]?.ROLE_ID || 3;

      const userResult = await executeQuery(
        `INSERT INTO USERS (USERNAME, EMAIL, PASSWORD_HASH, FIRST_NAME, LAST_NAME, PHONE, ROLE_ID)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING USER_ID`,
        [email.split('@')[0], email.toLowerCase(), passwordHash, firstName, lastName, phone || null, roleId]
      );
      finalUserId = userResult.rows[0].USER_ID;
    }
  }

  if (!finalUserId) {
    throw new APIError('User details or user ID required', 400, 'USER_INFO_REQUIRED');
  }

  // Check if user exists and is not already a doctor
  const userCheck = await executeQuery(
    'SELECT USER_ID FROM USERS WHERE USER_ID = $1',
    [finalUserId]
  );

  if (userCheck.rows.length === 0) {
    throw new APIError('User not found', 404, 'USER_NOT_FOUND');
  }

  const existingDoctor = await executeQuery(
    'SELECT DOCTOR_ID FROM DOCTORS WHERE USER_ID = $1',
    [finalUserId]
  );

  if (existingDoctor.rows.length > 0) {
    throw new APIError('User is already registered as a doctor', 409, 'DOCTOR_EXISTS');
  }

  const empId = employeeId || `EMP${Date.now().toString().slice(-6)}`;
  const licNum = licenseNumber || `LIC${Date.now().toString().slice(-6)}`;
  const jDate = joiningDate || new Date().toISOString().split('T')[0];

  const result = await executeQuery(
    `INSERT INTO DOCTORS (
      USER_ID, EMPLOYEE_ID, SPECIALIZATION, DEPT_ID, QUALIFICATION,
      EXPERIENCE_YEARS, CONSULTATION_FEE, LICENSE_NUMBER, JOINING_DATE, BIO, STATUS
    ) VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8, 
      $9::date, $10, $11
    ) RETURNING DOCTOR_ID`,
    [
      finalUserId,
      empId,
      specialization,
      departmentId || null,
      qualification || null,
      experienceYears || 0,
      consultationFee || 0,
      licNum,
      jDate,
      bio || null,
      status || 'ACTIVE'
    ]
  );

  const doctorId = result.rows[0].DOCTOR_ID;

  res.status(201).json({
    success: true,
    message: 'Doctor created successfully',
    data: { doctorId }
  });
});

/**
 * @desc    Update doctor
 * @route   PUT /api/doctors/:id
 * @access  Private (Admin only)
 */
const updateDoctor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const doctorCheck = await executeQuery(
    'SELECT DOCTOR_ID, USER_ID FROM DOCTORS WHERE DOCTOR_ID = $1',
    [parseInt(id)]
  );

  if (doctorCheck.rows.length === 0) {
    throw new APIError('Doctor not found', 404, 'DOCTOR_NOT_FOUND');
  }

  const userId = doctorCheck.rows[0].USER_ID;

  // Fields that update the DOCTORS table
  const doctorFieldMappings = {
    specialization: 'SPECIALIZATION',
    departmentId: 'DEPT_ID',
    qualification: 'QUALIFICATION',
    experienceYears: 'EXPERIENCE_YEARS',
    consultationFee: 'CONSULTATION_FEE',
    licenseNumber: 'LICENSE_NUMBER',
    joiningDate: 'JOINING_DATE',
    status: 'STATUS',
    rating: 'RATING',
    bio: 'BIO'
  };

  // Fields that update the USERS table
  const userFieldMappings = {
    firstName: 'FIRST_NAME',
    lastName: 'LAST_NAME',
    email: 'EMAIL',
    phone: 'PHONE'
  };

  // Build DOCTORS update
  const doctorUpdates = [];
  const doctorParams = [parseInt(id)];
  let dParamIndex = 2; // $1 is doctor_id

  for (const [key, value] of Object.entries(updateData)) {
    if (doctorFieldMappings[key] && value !== undefined) {
      if (key === 'joiningDate') {
        const dateOnly = value ? String(value).split('T')[0] : value;
        doctorUpdates.push(`${doctorFieldMappings[key]} = $${dParamIndex++}::date`);
        doctorParams.push(dateOnly);
      } else if (key === 'status') {
        doctorUpdates.push(`${doctorFieldMappings[key]} = $${dParamIndex++}`);
        doctorParams.push(value.toUpperCase());
      } else {
        doctorUpdates.push(`${doctorFieldMappings[key]} = $${dParamIndex++}`);
        doctorParams.push(value);
      }
    }
  }

  // Build USERS update
  const userUpdates = [];
  const userParams = [userId];
  let uParamIndex = 2; // $1 is user_id

  for (const [key, value] of Object.entries(updateData)) {
    if (userFieldMappings[key] && value !== undefined) {
      userUpdates.push(`${userFieldMappings[key]} = $${uParamIndex++}`);
      userParams.push(value);
    }
  }

  if (doctorUpdates.length === 0 && userUpdates.length === 0) {
    throw new APIError('No fields to update', 400, 'NO_UPDATE_FIELDS');
  }

  if (doctorUpdates.length > 0) {
    await executeQuery(
      `UPDATE DOCTORS SET ${doctorUpdates.join(', ')} WHERE DOCTOR_ID = $1`,
      doctorParams
    );
    
    // Sync status to USERS if changed
    if (updateData.status) {
      userUpdates.push(`STATUS = $${uParamIndex++}`);
      userParams.push(updateData.status.toUpperCase());
    }
  }

  if (userUpdates.length > 0) {
    await executeQuery(
      `UPDATE USERS SET ${userUpdates.join(', ')} WHERE USER_ID = $1`,
      userParams
    );
  }

  res.json({
    success: true,
    message: 'Doctor updated successfully'
  });
});

/**
 * @desc    Delete doctor
 * @route   DELETE /api/doctors/:id
 * @access  Private (Admin only)
 */
const deleteDoctor = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const doctorCheck = await executeQuery(
    'SELECT DOCTOR_ID FROM DOCTORS WHERE DOCTOR_ID = $1',
    [parseInt(id)]
  );

  if (doctorCheck.rows.length === 0) {
    throw new APIError('Doctor not found', 404, 'DOCTOR_NOT_FOUND');
  }

  // Check for assigned patients
  const assignedPatients = await executeQuery(
    'SELECT COUNT(*) as count FROM PATIENTS WHERE ASSIGNED_DOCTOR_ID = $1',
    [parseInt(id)]
  );

  if (assignedPatients.rows[0].COUNT > 0) {
    throw new APIError(
      'Cannot delete doctor with assigned patients. Please reassign patients first.',
      400,
      'DOCTOR_HAS_PATIENTS'
    );
  }

  await executeQuery(
    'DELETE FROM DOCTORS WHERE DOCTOR_ID = $1',
    [parseInt(id)]
  );

  res.json({
    success: true,
    message: 'Doctor deleted successfully'
  });
});

/**
 * @desc    Get doctor's assigned patients
 * @route   GET /api/doctors/:id/patients
 * @access  Private
 */
const getDoctorPatients = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const baseQuery = `
    SELECT 
      P.PATIENT_ID, P.PATIENT_CODE, P.FIRST_NAME, P.LAST_NAME,
      P.DATE_OF_BIRTH, P.GENDER, P.BLOOD_GROUP, P.PHONE, P.STATUS,
      P.CREATED_AT
    FROM PATIENTS P
    WHERE P.ASSIGNED_DOCTOR_ID = $1
    ORDER BY P.CREATED_AT DESC
  `;

  const result = await executeQueryWithPagination(
    baseQuery,
    [parseInt(id)],
    parseInt(page),
    parseInt(limit)
  );

  const patients = result.data.map(row => ({
    patientId: row.PATIENT_ID,
    patientCode: row.PATIENT_CODE,
    firstName: row.FIRST_NAME,
    lastName: row.LAST_NAME,
    fullName: `${row.FIRST_NAME} ${row.LAST_NAME}`,
    dateOfBirth: row.DATE_OF_BIRTH,
    gender: row.GENDER,
    bloodGroup: row.BLOOD_GROUP,
    phone: row.PHONE,
    status: row.STATUS,
    createdAt: row.CREATED_AT
  }));

  res.json({
    success: true,
    data: patients,
    pagination: result.pagination
  });
});

/**
 * @desc    Get doctor's schedule
 * @route   GET /api/doctors/:id/schedule
 * @access  Private
 */
const getDoctorSchedule = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await executeQuery(
    `SELECT * FROM DOCTOR_SCHEDULES 
     WHERE DOCTOR_ID = $1
     ORDER BY DAY_OF_WEEK`,
    [parseInt(id)]
  );

  const schedule = result.rows.map(row => ({
    scheduleId: row.SCHEDULE_ID,
    dayOfWeek: row.DAY_OF_WEEK,
    startTime: row.START_TIME,
    endTime: row.END_TIME,
    slotDuration: row.SLOT_DURATION,
    maxPatients: row.MAX_PATIENTS,
    isAvailable: row.IS_AVAILABLE,
    createdAt: row.CREATED_AT,
    updatedAt: row.UPDATED_AT
  }));

  res.json({
    success: true,
    data: schedule
  });
});

/**
 * @desc    Add or update doctor schedule
 * @route   POST /api/doctors/:id/schedule
 * @access  Private (Admin only)
 */
const updateDoctorSchedule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { schedules } = req.body;

  // Validate doctor exists
  const doctorCheck = await executeQuery(
    'SELECT DOCTOR_ID FROM DOCTORS WHERE DOCTOR_ID = $1',
    [parseInt(id)]
  );

  if (doctorCheck.rows.length === 0) {
    throw new APIError('Doctor not found', 404, 'DOCTOR_NOT_FOUND');
  }

  // Delete existing schedules
  await executeQuery(
    'DELETE FROM DOCTOR_SCHEDULES WHERE DOCTOR_ID = $1',
    [parseInt(id)]
  );

  // Insert new schedules
  for (const schedule of schedules) {
    await executeQuery(
      `INSERT INTO DOCTOR_SCHEDULES (
        DOCTOR_ID, DAY_OF_WEEK, START_TIME, END_TIME, 
        SLOT_DURATION, MAX_PATIENTS, IS_AVAILABLE
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7
      )`,
      [
        parseInt(id),
        schedule.dayOfWeek,
        schedule.startTime,
        schedule.endTime,
        schedule.slotDuration || 30,
        schedule.maxPatients || 10,
        schedule.isAvailable !== undefined ? schedule.isAvailable : 1
      ]
    );
  }

  res.json({
    success: true,
    message: 'Schedule updated successfully'
  });
});

/**
 * @desc    Get all specializations
 * @route   GET /api/doctors/specializations
 * @access  Private
 */
const getSpecializations = asyncHandler(async (req, res) => {
  const result = await executeQuery(
    `SELECT DISTINCT SPECIALIZATION 
     FROM DOCTORS 
     WHERE STATUS = 'ACTIVE'
     ORDER BY SPECIALIZATION`
  );

  const specializations = result.rows.map(row => row.SPECIALIZATION);

  res.json({
    success: true,
    data: specializations
  });
});

/**
 * @desc    Get available time slots for a doctor on a specific date
 * @route   GET /api/doctors/:id/available-slots
 * @access  Private
 */
const getAvailableSlots = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { date } = req.query;

  if (!date) {
    throw new APIError('Date is required', 400, 'MISSING_DATE');
  }

  // Get doctor's schedule for that day
  const dayOfWeek = new Date(date).getDay();

  const scheduleResult = await executeQuery(
    `SELECT START_TIME, END_TIME, SLOT_DURATION 
     FROM DOCTOR_SCHEDULES 
     WHERE DOCTOR_ID = $1 AND DAY_OF_WEEK = $2 AND IS_AVAILABLE = 1`,
    [parseInt(id), dayOfWeek]
  );

  if (scheduleResult.rows.length === 0) {
    return res.json({
      success: true,
      data: []
    });
  }

  const schedule = scheduleResult.rows[0];

  // Get booked slots
  const bookedResult = await executeQuery(
    `SELECT APPOINTMENT_TIME 
     FROM APPOINTMENTS 
     WHERE DOCTOR_ID = $1 
     AND APPOINTMENT_DATE::date = $2::date
     AND STATUS IN ('SCHEDULED', 'CONFIRMED')`,
    [parseInt(id), date]
  );

  const bookedSlots = bookedResult.rows.map(r => r.APPOINTMENT_TIME);

  // Generate available slots
  const slots = [];
  const startTime = schedule.START_TIME;
  const endTime = schedule.END_TIME;
  const slotDuration = schedule.SLOT_DURATION;

  let currentTime = new Date(`2000-01-01T${startTime}`);
  const endDateTime = new Date(`2000-01-01T${endTime}`);

  while (currentTime < endDateTime) {
    const timeString = currentTime.toTimeString().slice(0, 5);
    if (!bookedSlots.includes(timeString)) {
      slots.push(timeString);
    }
    currentTime = new Date(currentTime.getTime() + slotDuration * 60000);
  }

  res.json({
    success: true,
    data: slots
  });
});

module.exports = {
  getDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getDoctorPatients,
  getDoctorSchedule,
  updateDoctorSchedule,
  getSpecializations,
  getAvailableSlots
};
