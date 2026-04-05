/**
 * Patient Controller
 * Handles patient CRUD operations and related functionality
 */
const { executeQuery, executeQueryWithPagination } = require('../config/database');
const { APIError, asyncHandler } = require('../middlewares/errorHandler');

/**
 * @desc    Get all patients with pagination and filtering
 * @route   GET /api/patients
 * @access  Private
 */
const getPatients = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    status = '',
    doctorId = '',
    sortBy = 'CREATED_AT',
    sortOrder = 'DESC'
  } = req.query;

  // Build the base query
  let baseQuery = `
    SELECT 
      P.PATIENT_ID, P.PATIENT_CODE, P.FIRST_NAME, P.LAST_NAME, 
      P.DATE_OF_BIRTH, P.GENDER, P.BLOOD_GROUP, P.PHONE, P.EMAIL,
      P.ADDRESS, P.CITY, P.STATE, P.ZIP_CODE,
      P.EMERGENCY_CONTACT_NAME, P.EMERGENCY_CONTACT_PHONE,
      P.INSURANCE_PROVIDER, P.INSURANCE_NUMBER,
      P.ALLERGIES, P.CHRONIC_CONDITIONS,
      P.STATUS, P.ADMISSION_DATE, P.DISCHARGE_DATE,
      P.ASSIGNED_DOCTOR_ID, P.CREATED_AT, P.UPDATED_AT,
      U.FIRST_NAME || ' ' || U.LAST_NAME as DOCTOR_NAME,
      D.SPECIALIZATION as DOCTOR_SPECIALIZATION
    FROM PATIENTS P
    LEFT JOIN DOCTORS DOC ON P.ASSIGNED_DOCTOR_ID = DOC.DOCTOR_ID
    LEFT JOIN USERS U ON DOC.USER_ID = U.USER_ID
    LEFT JOIN DOCTORS D ON P.ASSIGNED_DOCTOR_ID = D.DOCTOR_ID
    WHERE 1=1
  `;

  const params = [];
  let paramIndex = 1;

  // Add search filter
  if (search) {
    baseQuery += ` AND (
      UPPER(P.FIRST_NAME) LIKE UPPER($${paramIndex}) OR 
      UPPER(P.LAST_NAME) LIKE UPPER($${paramIndex}) OR 
      UPPER(P.PATIENT_CODE) LIKE UPPER($${paramIndex}) OR
      UPPER(P.PHONE) LIKE UPPER($${paramIndex}) OR
      UPPER(P.EMAIL) LIKE UPPER($${paramIndex})
    )`;
    paramIndex++;
    params.push(`%${search}%`);
  }

  // Add status filter
  if (status) {
    baseQuery += ` AND P.STATUS = $${paramIndex++}`;
    params.push(status.toUpperCase());
  }

  // Add doctor filter
  if (doctorId) {
    baseQuery += ` AND P.ASSIGNED_DOCTOR_ID = $${paramIndex++}`;
    params.push(parseInt(doctorId));
  }

  // Add sorting
  const allowedSortColumns = ['FIRST_NAME', 'LAST_NAME', 'CREATED_AT', 'STATUS', 'PATIENT_CODE'];
  const orderBy = allowedSortColumns.includes(sortBy.toUpperCase()) ? sortBy.toUpperCase() : 'CREATED_AT';
  const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  baseQuery += ` ORDER BY P.${orderBy} ${order}`;

  // Execute paginated query
  const result = await executeQueryWithPagination(baseQuery, params, parseInt(page), parseInt(limit));

  // Format response
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
    email: row.EMAIL,
    address: row.ADDRESS,
    city: row.CITY,
    state: row.STATE,
    zipCode: row.ZIP_CODE,
    emergencyContact: {
      name: row.EMERGENCY_CONTACT_NAME,
      phone: row.EMERGENCY_CONTACT_PHONE
    },
    insurance: {
      provider: row.INSURANCE_PROVIDER,
      number: row.INSURANCE_NUMBER
    },
    medicalInfo: {
      allergies: row.ALLERGIES,
      chronicConditions: row.CHRONIC_CONDITIONS
    },
    status: row.STATUS,
    admissionDate: row.ADMISSION_DATE,
    dischargeDate: row.DISCHARGE_DATE,
    assignedDoctor: row.ASSIGNED_DOCTOR_ID ? {
      doctorId: row.ASSIGNED_DOCTOR_ID,
      name: row.DOCTOR_NAME,
      specialization: row.DOCTOR_SPECIALIZATION
    } : null,
    createdAt: row.CREATED_AT,
    updatedAt: row.UPDATED_AT
  }));

  res.json({
    success: true,
    data: patients,
    pagination: result.pagination
  });
});

/**
 * @desc    Get single patient by ID
 * @route   GET /api/patients/:id
 * @access  Private
 */
const getPatientById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await executeQuery(
    `SELECT 
      P.*,
      U.FIRST_NAME || ' ' || U.LAST_NAME as DOCTOR_NAME,
      D.SPECIALIZATION as DOCTOR_SPECIALIZATION
    FROM PATIENTS P
    LEFT JOIN DOCTORS DOC ON P.ASSIGNED_DOCTOR_ID = DOC.DOCTOR_ID
    LEFT JOIN USERS U ON DOC.USER_ID = U.USER_ID
    LEFT JOIN DOCTORS D ON P.ASSIGNED_DOCTOR_ID = D.DOCTOR_ID
    WHERE P.PATIENT_ID = $1`,
    [parseInt(id)]
  );

  if (result.rows.length === 0) {
    throw new APIError('Patient not found', 404, 'PATIENT_NOT_FOUND');
  }

  const row = result.rows[0];

  const patient = {
    patientId: row.PATIENT_ID,
    patientCode: row.PATIENT_CODE,
    firstName: row.FIRST_NAME,
    lastName: row.LAST_NAME,
    fullName: `${row.FIRST_NAME} ${row.LAST_NAME}`,
    dateOfBirth: row.DATE_OF_BIRTH,
    gender: row.GENDER,
    bloodGroup: row.BLOOD_GROUP,
    phone: row.PHONE,
    email: row.EMAIL,
    address: row.ADDRESS,
    city: row.CITY,
    state: row.STATE,
    zipCode: row.ZIP_CODE,
    emergencyContact: {
      name: row.EMERGENCY_CONTACT_NAME,
      phone: row.EMERGENCY_CONTACT_PHONE
    },
    insurance: {
      provider: row.INSURANCE_PROVIDER,
      number: row.INSURANCE_NUMBER
    },
    medicalInfo: {
      allergies: row.ALLERGIES,
      chronicConditions: row.CHRONIC_CONDITIONS
    },
    status: row.STATUS,
    admissionDate: row.ADMISSION_DATE,
    dischargeDate: row.DISCHARGE_DATE,
    assignedDoctor: row.ASSIGNED_DOCTOR_ID ? {
      doctorId: row.ASSIGNED_DOCTOR_ID,
      name: row.DOCTOR_NAME,
      specialization: row.DOCTOR_SPECIALIZATION
    } : null,
    createdAt: row.CREATED_AT,
    updatedAt: row.UPDATED_AT
  };

  res.json({
    success: true,
    data: patient
  });
});

/**
 * @desc    Create new patient
 * @route   POST /api/patients
 * @access  Private (Admin, Receptionist, Doctor)
 */
const createPatient = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    dateOfBirth,
    gender,
    bloodGroup,
    phone,
    email,
    address,
    city,
    state,
    zipCode,
    emergencyContactName,
    emergencyContactPhone,
    insuranceProvider,
    insuranceNumber,
    allergies,
    chronicConditions,
    assignedDoctorId
  } = req.body;

  // Generate patient code
  const codeResult = await executeQuery(
    `SELECT 'P' || LPAD(nextval('SEQ_PATIENTS')::text, 5, '0') as PATIENT_CODE`
  );
  const patientCode = codeResult.rows[0].PATIENT_CODE;

  const result = await executeQuery(
    `INSERT INTO PATIENTS (
      PATIENT_CODE, FIRST_NAME, LAST_NAME, DATE_OF_BIRTH, GENDER, BLOOD_GROUP,
      PHONE, EMAIL, ADDRESS, CITY, STATE, ZIP_CODE,
      EMERGENCY_CONTACT_NAME, EMERGENCY_CONTACT_PHONE,
      INSURANCE_PROVIDER, INSURANCE_NUMBER, ALLERGIES, CHRONIC_CONDITIONS,
      ASSIGNED_DOCTOR_ID
    ) VALUES (
      $1, $2, $3, $4::date, $5, $6, $7, $8, $9, $10, $11, $12,
      $13, $14, $15, $16, $17, $18, $19
    ) RETURNING PATIENT_ID`,
    [
      patientCode,
      firstName,
      lastName,
      dateOfBirth,
      gender.toUpperCase(),
      bloodGroup,
      phone,
      email || null,
      address || null,
      city || null,
      state || null,
      zipCode || null,
      emergencyContactName || null,
      emergencyContactPhone || null,
      insuranceProvider || null,
      insuranceNumber || null,
      allergies || null,
      chronicConditions || null,
      assignedDoctorId || null
    ]
  );

  const patientId = result.rows[0].PATIENT_ID;

  res.status(201).json({
    success: true,
    message: 'Patient created successfully',
    data: {
      patientId,
      patientCode
    }
  });
});

/**
 * @desc    Update patient
 * @route   PUT /api/patients/:id
 * @access  Private
 */
const updatePatient = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  // Check if patient exists
  const patientCheck = await executeQuery(
    'SELECT PATIENT_ID FROM PATIENTS WHERE PATIENT_ID = $1',
    [parseInt(id)]
  );

  if (patientCheck.rows.length === 0) {
    throw new APIError('Patient not found', 404, 'PATIENT_NOT_FOUND');
  }

  // Build dynamic update query
  const fieldMappings = {
    firstName: 'FIRST_NAME',
    lastName: 'LAST_NAME',
    dateOfBirth: 'DATE_OF_BIRTH',
    gender: 'GENDER',
    bloodGroup: 'BLOOD_GROUP',
    phone: 'PHONE',
    email: 'EMAIL',
    address: 'ADDRESS',
    city: 'CITY',
    state: 'STATE',
    zipCode: 'ZIP_CODE',
    emergencyContactName: 'EMERGENCY_CONTACT_NAME',
    emergencyContactPhone: 'EMERGENCY_CONTACT_PHONE',
    insuranceProvider: 'INSURANCE_PROVIDER',
    insuranceNumber: 'INSURANCE_NUMBER',
    allergies: 'ALLERGIES',
    chronicConditions: 'CHRONIC_CONDITIONS',
    assignedDoctorId: 'ASSIGNED_DOCTOR_ID',
    status: 'STATUS'
  };

  const updates = [];
  const params = [parseInt(id)];
  let paramIndex = 2; // $1 is patient_id

  for (const [key, value] of Object.entries(updateData)) {
    if (fieldMappings[key] && value !== undefined) {
      if (key === 'dateOfBirth') {
        const dateOnly = value ? String(value).split('T')[0] : value;
        updates.push(`${fieldMappings[key]} = $${paramIndex++}::date`);
        params.push(dateOnly);
      } else if (key === 'gender' || key === 'status') {
        updates.push(`${fieldMappings[key]} = $${paramIndex++}`);
        params.push(value.toUpperCase());
      } else {
        updates.push(`${fieldMappings[key]} = $${paramIndex++}`);
        params.push(value);
      }
    }
  }

  if (updates.length === 0) {
    throw new APIError('No fields to update', 400, 'NO_UPDATE_FIELDS');
  }

  const updateSql = `UPDATE PATIENTS SET ${updates.join(', ')} WHERE PATIENT_ID = $1`;

  await executeQuery(updateSql, params);

  res.json({
    success: true,
    message: 'Patient updated successfully'
  });
});

/**
 * @desc    Delete patient
 * @route   DELETE /api/patients/:id
 * @access  Private (Admin only)
 */
const deletePatient = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if patient exists
  const patientCheck = await executeQuery(
    'SELECT PATIENT_ID FROM PATIENTS WHERE PATIENT_ID = $1',
    [parseInt(id)]
  );

  if (patientCheck.rows.length === 0) {
    throw new APIError('Patient not found', 404, 'PATIENT_NOT_FOUND');
  }

  // Check for related records
  const relatedCheck = await executeQuery(
    `SELECT 
      (SELECT COUNT(*) FROM APPOINTMENTS WHERE PATIENT_ID = $1) as appointments,
      (SELECT COUNT(*) FROM INVOICES WHERE PATIENT_ID = $1) as invoices,
      (SELECT COUNT(*) FROM MEDICAL_HISTORY WHERE PATIENT_ID = $1) as medical_history`,
    [parseInt(id)]
  );

  const related = relatedCheck.rows[0];
  if (related.APPOINTMENTS > 0 || related.INVOICES > 0 || related.MEDICAL_HISTORY > 0) {
    throw new APIError(
      'Cannot delete patient with existing appointments, invoices, or medical records. Consider marking as inactive instead.',
      400,
      'PATIENT_HAS_RELATED_RECORDS'
    );
  }

  await executeQuery(
    'DELETE FROM PATIENTS WHERE PATIENT_ID = $1',
    [parseInt(id)]
  );

  res.json({
    success: true,
    message: 'Patient deleted successfully'
  });
});

/**
 * @desc    Get patient medical history
 * @route   GET /api/patients/:id/medical-history
 * @access  Private
 */
const getMedicalHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 10 } = req.query;

  // Check if patient exists
  const patientCheck = await executeQuery(
    'SELECT PATIENT_ID FROM PATIENTS WHERE PATIENT_ID = $1',
    [parseInt(id)]
  );

  if (patientCheck.rows.length === 0) {
    throw new APIError('Patient not found', 404, 'PATIENT_NOT_FOUND');
  }

  const baseQuery = `
    SELECT 
      MH.HISTORY_ID, MH.VISIT_DATE, MH.DIAGNOSIS, MH.SYMPTOMS,
      MH.PRESCRIPTION, MH.NOTES, MH.ATTACHMENTS, MH.FOLLOW_UP_DATE,
      MH.CREATED_AT, MH.UPDATED_AT,
      U.FIRST_NAME || ' ' || U.LAST_NAME as DOCTOR_NAME,
      D.SPECIALIZATION
    FROM MEDICAL_HISTORY MH
    JOIN DOCTORS DOC ON MH.DOCTOR_ID = DOC.DOCTOR_ID
    JOIN USERS U ON DOC.USER_ID = U.USER_ID
    JOIN DOCTORS D ON MH.DOCTOR_ID = D.DOCTOR_ID
    WHERE MH.PATIENT_ID = $1
    ORDER BY MH.VISIT_DATE DESC
  `;

  const result = await executeQueryWithPagination(
    baseQuery,
    [parseInt(id)],
    parseInt(page),
    parseInt(limit)
  );

  const history = result.data.map(row => ({
    historyId: row.HISTORY_ID,
    visitDate: row.VISIT_DATE,
    diagnosis: row.DIAGNOSIS,
    symptoms: row.SYMPTOMS,
    prescription: row.PRESCRIPTION,
    notes: row.NOTES,
    attachments: row.ATTACHMENTS ? JSON.parse(row.ATTACHMENTS) : [],
    followUpDate: row.FOLLOW_UP_DATE,
    doctor: {
      name: row.DOCTOR_NAME,
      specialization: row.SPECIALIZATION
    },
    createdAt: row.CREATED_AT,
    updatedAt: row.UPDATED_AT
  }));

  res.json({
    success: true,
    data: history,
    pagination: result.pagination
  });
});

/**
 * @desc    Add medical history record
 * @route   POST /api/patients/:id/medical-history
 * @access  Private (Doctor only)
 */
const addMedicalHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    visitDate,
    doctorId,
    diagnosis,
    symptoms,
    prescription,
    notes,
    attachments,
    followUpDate
  } = req.body;

  // Check if patient exists
  const patientCheck = await executeQuery(
    'SELECT PATIENT_ID FROM PATIENTS WHERE PATIENT_ID = $1',
    [parseInt(id)]
  );

  if (patientCheck.rows.length === 0) {
    throw new APIError('Patient not found', 404, 'PATIENT_NOT_FOUND');
  }

  const result = await executeQuery(
    `INSERT INTO MEDICAL_HISTORY (
      PATIENT_ID, VISIT_DATE, DOCTOR_ID, DIAGNOSIS, SYMPTOMS,
      PRESCRIPTION, NOTES, ATTACHMENTS, FOLLOW_UP_DATE
    ) VALUES (
      $1, $2::date, $3,
      $4, $5, $6, $7, $8,
      $9
    ) RETURNING HISTORY_ID`,
    [
      parseInt(id),
      visitDate,
      doctorId,
      diagnosis || null,
      symptoms || null,
      prescription || null,
      notes || null,
      attachments ? JSON.stringify(attachments) : null,
      followUpDate || null
    ]
  );

  // Update doctor's patients seen count
  await executeQuery(
    `UPDATE DOCTORS SET PATIENTS_SEEN = PATIENTS_SEEN + 1 WHERE DOCTOR_ID = $1`,
    [doctorId]
  );

  const historyId = result.rows[0].HISTORY_ID;

  res.status(201).json({
    success: true,
    message: 'Medical history record added successfully',
    data: { historyId }
  });
});

/**
 * @desc    Get patient appointments
 * @route   GET /api/patients/:id/appointments
 * @access  Private
 */
const getPatientAppointments = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const baseQuery = `
    SELECT 
      A.*,
      U.FIRST_NAME || ' ' || U.LAST_NAME as DOCTOR_NAME,
      D.SPECIALIZATION
    FROM APPOINTMENTS A
    JOIN DOCTORS DOC ON A.DOCTOR_ID = DOC.DOCTOR_ID
    JOIN USERS U ON DOC.USER_ID = U.USER_ID
    JOIN DOCTORS D ON A.DOCTOR_ID = D.DOCTOR_ID
    WHERE A.PATIENT_ID = $1
    ORDER BY A.APPOINTMENT_DATE DESC, A.APPOINTMENT_TIME DESC
  `;

  const result = await executeQueryWithPagination(
    baseQuery,
    [parseInt(id)],
    parseInt(page),
    parseInt(limit)
  );

  const appointments = result.data.map(row => ({
    appointmentId: row.APPOINTMENT_ID,
    appointmentCode: row.APPOINTMENT_CODE,
    appointmentDate: row.APPOINTMENT_DATE,
    appointmentTime: row.APPOINTMENT_TIME,
    type: row.TYPE,
    status: row.STATUS,
    reason: row.REASON,
    notes: row.NOTES,
    doctor: {
      name: row.DOCTOR_NAME,
      specialization: row.SPECIALIZATION
    },
    createdAt: row.CREATED_AT
  }));

  res.json({
    success: true,
    data: appointments,
    pagination: result.pagination
  });
});

module.exports = {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  getMedicalHistory,
  addMedicalHistory,
  getPatientAppointments
};
