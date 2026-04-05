/**
 * Room & Bed Controller
 * Handles room and bed management
 */
const { executeQuery, executeQueryWithPagination } = require('../config/database');
const { APIError, asyncHandler } = require('../middlewares/errorHandler');

/**
 * @desc    Get all rooms with pagination and filtering
 * @route   GET /api/rooms
 * @access  Private
 */
const getRooms = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    roomType = '',
    status = '',
    departmentId = '',
    floor = ''
  } = req.query;

  let baseQuery = `
    SELECT 
      R.ROOM_ID, R.ROOM_NUMBER, R.ROOM_TYPE, R.FLOOR, R.CAPACITY,
      R.RENT_PER_DAY, R.FACILITIES, R.STATUS,
      R.CREATED_AT, R.UPDATED_AT,
      D.DEPT_ID, D.DEPT_NAME, D.DEPT_CODE,
      (SELECT COUNT(*) FROM BEDS WHERE ROOM_ID = R.ROOM_ID) as total_beds,
      (SELECT COUNT(*) FROM BEDS WHERE ROOM_ID = R.ROOM_ID AND STATUS = 'OCCUPIED') as occupied_beds
    FROM ROOMS R
    LEFT JOIN DEPARTMENTS D ON R.DEPT_ID = D.DEPT_ID
    WHERE 1=1
  `;

  const params = [];
  let paramIndex = 1;

  if (roomType) {
    baseQuery += ` AND R.ROOM_TYPE = $${paramIndex++}`;
    params.push(roomType.toUpperCase());
  }

  if (status) {
    baseQuery += ` AND R.STATUS = $${paramIndex++}`;
    params.push(status.toUpperCase());
  }

  if (departmentId) {
    baseQuery += ` AND R.DEPT_ID = $${paramIndex++}`;
    params.push(parseInt(departmentId));
  }

  if (floor) {
    baseQuery += ` AND R.FLOOR = $${paramIndex++}`;
    params.push(parseInt(floor));
  }

  baseQuery += ` ORDER BY R.CREATED_AT DESC`;

  const result = await executeQueryWithPagination(baseQuery, params, parseInt(page), parseInt(limit));

  const rooms = result.data.map(row => ({
    roomId: row.ROOM_ID,
    roomNumber: row.ROOM_NUMBER,
    roomType: row.ROOM_TYPE,
    floor: row.FLOOR,
    capacity: row.CAPACITY,
    rentPerDay: row.RENT_PER_DAY,
    facilities: row.FACILITIES ? JSON.parse(row.FACILITIES) : [],
    status: row.STATUS,
    department: row.DEPT_ID ? {
      deptId: row.DEPT_ID,
      deptName: row.DEPT_NAME,
      deptCode: row.DEPT_CODE
    } : null,
    bedStats: {
      total: row.TOTAL_BEDS || row.total_beds || 0,
      occupied: row.OCCUPIED_BEDS || row.occupied_beds || 0,
      available: (row.TOTAL_BEDS || row.total_beds || 0) - (row.OCCUPIED_BEDS || row.occupied_beds || 0)
    },
    createdAt: row.CREATED_AT,
    updatedAt: row.UPDATED_AT
  }));

  res.json({
    success: true,
    data: rooms,
    pagination: result.pagination
  });
});

/**
 * @desc    Get single room by ID with beds
 * @route   GET /api/rooms/:id
 * @access  Private
 */
const getRoomById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const roomResult = await executeQuery(
    `SELECT 
      R.*,
      D.DEPT_ID, D.DEPT_NAME, D.DEPT_CODE
    FROM ROOMS R
    LEFT JOIN DEPARTMENTS D ON R.DEPT_ID = D.DEPT_ID
    WHERE R.ROOM_ID = $1`,
    [parseInt(id)]
  );

  if (roomResult.rows.length === 0) {
    throw new APIError('Room not found', 404, 'ROOM_NOT_FOUND');
  }

  const row = roomResult.rows[0];

  // Get beds in the room
  const bedsResult = await executeQuery(
    `SELECT 
      B.*,
      PB.PATIENT_ID, PB.ASSIGNED_DATE, PB.STATUS as ASSIGNMENT_STATUS,
      P.PATIENT_CODE, P.FIRST_NAME || ' ' || P.LAST_NAME as PATIENT_NAME
    FROM BEDS B
    LEFT JOIN PATIENT_BEDS PB ON B.BED_ID = PB.BED_ID AND PB.STATUS = 'ACTIVE'
    LEFT JOIN PATIENTS P ON PB.PATIENT_ID = P.PATIENT_ID
    WHERE B.ROOM_ID = $1
    ORDER BY B.BED_NUMBER`,
    [parseInt(id)]
  );

  const room = {
    roomId: row.ROOM_ID,
    roomNumber: row.ROOM_NUMBER,
    roomType: row.ROOM_TYPE,
    floor: row.FLOOR,
    capacity: row.CAPACITY,
    rentPerDay: row.RENT_PER_DAY,
    facilities: row.FACILITIES ? JSON.parse(row.FACILITIES) : [],
    status: row.STATUS,
    department: row.DEPT_ID ? {
      deptId: row.DEPT_ID,
      deptName: row.DEPT_NAME,
      deptCode: row.DEPT_CODE
    } : null,
    beds: bedsResult.rows.map(bed => ({
      bedId: bed.BED_ID,
      bedNumber: bed.BED_NUMBER,
      bedType: bed.BED_TYPE,
      status: bed.STATUS,
      patient: bed.PATIENT_ID ? {
        patientId: bed.PATIENT_ID,
        patientCode: bed.PATIENT_CODE,
        name: bed.PATIENT_NAME,
        assignedDate: bed.ASSIGNED_DATE
      } : null
    })),
    createdAt: row.CREATED_AT,
    updatedAt: row.UPDATED_AT
  };

  res.json({
    success: true,
    data: room
  });
});

/**
 * @desc    Create new room
 * @route   POST /api/rooms
 * @access  Private (Admin only)
 */
const createRoom = asyncHandler(async (req, res) => {
  const {
    roomNumber,
    roomType,
    departmentId,
    floor,
    capacity,
    rentPerDay,
    facilities
  } = req.body;

  const result = await executeQuery(
    `INSERT INTO ROOMS (
      ROOM_NUMBER, ROOM_TYPE, DEPT_ID, FLOOR, CAPACITY, RENT_PER_DAY, FACILITIES, STATUS
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8
    ) RETURNING ROOM_ID`,
    [
      roomNumber,
      roomType.toUpperCase(),
      departmentId || null,
      floor || 1,
      capacity || 1,
      rentPerDay || 0,
      facilities ? JSON.stringify(facilities) : null,
      'AVAILABLE'
    ]
  );

  const roomId = result.rows[0].ROOM_ID;

  // Create beds for the room
  for (let i = 1; i <= (capacity || 1); i++) {
    const bedNumber = `${roomNumber}-B${i}`;
    await executeQuery(
      `INSERT INTO BEDS (BED_NUMBER, ROOM_ID) VALUES ($1, $2)`,
      [bedNumber, roomId]
    );
  }

  res.status(201).json({
    success: true,
    message: 'Room created successfully',
    data: { roomId }
  });
});

/**
 * @desc    Update room
 * @route   PUT /api/rooms/:id
 * @access  Private (Admin only)
 */
const updateRoom = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const roomCheck = await executeQuery(
    'SELECT ROOM_ID FROM ROOMS WHERE ROOM_ID = $1',
    [parseInt(id)]
  );

  if (roomCheck.rows.length === 0) {
    throw new APIError('Room not found', 404, 'ROOM_NOT_FOUND');
  }

  const fieldMappings = {
    roomNumber: 'ROOM_NUMBER',
    roomType: 'ROOM_TYPE',
    departmentId: 'DEPT_ID',
    floor: 'FLOOR',
    rentPerDay: 'RENT_PER_DAY',
    facilities: 'FACILITIES',
    status: 'STATUS'
  };

  const updates = [];
  const params = [parseInt(id)];
  let paramIndex = 2; // $1 is room_id

  for (const [key, value] of Object.entries(updateData)) {
    if (fieldMappings[key] && value !== undefined) {
      if (key === 'facilities') {
        updates.push(`${fieldMappings[key]} = $${paramIndex++}`);
        params.push(JSON.stringify(value));
      } else if (key === 'roomType' || key === 'status') {
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

  const updateSql = `UPDATE ROOMS SET ${updates.join(', ')} WHERE ROOM_ID = $1`;

  await executeQuery(updateSql, params);

  res.json({
    success: true,
    message: 'Room updated successfully'
  });
});

/**
 * @desc    Delete room
 * @route   DELETE /api/rooms/:id
 * @access  Private (Admin only)
 */
const deleteRoom = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const roomCheck = await executeQuery(
    'SELECT ROOM_ID FROM ROOMS WHERE ROOM_ID = $1',
    [parseInt(id)]
  );

  if (roomCheck.rows.length === 0) {
    throw new APIError('Room not found', 404, 'ROOM_NOT_FOUND');
  }

  // Check for occupied beds
  const occupiedBeds = await executeQuery(
    'SELECT COUNT(*) as count FROM BEDS WHERE ROOM_ID = $1 AND STATUS = $2',
    [parseInt(id), 'OCCUPIED']
  );

  if (occupiedBeds.rows[0].COUNT > 0) {
    throw new APIError(
      'Cannot delete room with occupied beds. Please discharge patients first.',
      400,
      'ROOM_HAS_PATIENTS'
    );
  }

  await executeQuery(
    'DELETE FROM ROOMS WHERE ROOM_ID = $1',
    [parseInt(id)]
  );

  res.json({
    success: true,
    message: 'Room deleted successfully'
  });
});

/**
 * @desc    Get all beds with filtering
 * @route   GET /api/rooms/beds
 * @access  Private
 */
const getBeds = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    roomId = '',
    status = '',
    bedType = ''
  } = req.query;

  let baseQuery = `
    SELECT 
      B.BED_ID, B.BED_NUMBER, B.BED_TYPE, B.STATUS,
      B.CREATED_AT, B.UPDATED_AT,
      R.ROOM_ID, R.ROOM_NUMBER, R.ROOM_TYPE, R.FLOOR,
      PB.PATIENT_ID, PB.ASSIGNED_DATE,
      P.PATIENT_CODE, P.FIRST_NAME || ' ' || P.LAST_NAME as PATIENT_NAME,
      P.STATUS as PATIENT_STATUS
    FROM BEDS B
    JOIN ROOMS R ON B.ROOM_ID = R.ROOM_ID
    LEFT JOIN PATIENT_BEDS PB ON B.BED_ID = PB.BED_ID AND PB.STATUS = 'ACTIVE'
    LEFT JOIN PATIENTS P ON PB.PATIENT_ID = P.PATIENT_ID
    WHERE 1=1
  `;

  const params = [];
  let paramIndex = 1;

  if (roomId) {
    baseQuery += ` AND B.ROOM_ID = $${paramIndex++}`;
    params.push(parseInt(roomId));
  }

  if (status) {
    baseQuery += ` AND B.STATUS = $${paramIndex++}`;
    params.push(status.toUpperCase());
  }

  if (bedType) {
    baseQuery += ` AND B.BED_TYPE = $${paramIndex++}`;
    params.push(bedType.toUpperCase());
  }

  baseQuery += ` ORDER BY R.ROOM_NUMBER, B.BED_NUMBER`;

  const result = await executeQueryWithPagination(baseQuery, params, parseInt(page), parseInt(limit));

  const beds = result.data.map(row => ({
    bedId: row.BED_ID,
    bedNumber: row.BED_NUMBER,
    bedType: row.BED_TYPE,
    status: row.STATUS,
    room: {
      roomId: row.ROOM_ID,
      roomNumber: row.ROOM_NUMBER,
      roomType: row.ROOM_TYPE,
      floor: row.FLOOR
    },
    patient: row.PATIENT_ID ? {
      patientId: row.PATIENT_ID,
      patientCode: row.PATIENT_CODE,
      name: row.PATIENT_NAME,
      assignedDate: row.ASSIGNED_DATE,
      status: row.PATIENT_STATUS
    } : null,
    createdAt: row.CREATED_AT,
    updatedAt: row.UPDATED_AT
  }));

  res.json({
    success: true,
    data: beds,
    pagination: result.pagination
  });
});

/**
 * @desc    Assign bed to patient
 * @route   POST /api/rooms/beds/:bedId/assign
 * @access  Private
 */
const assignBed = asyncHandler(async (req, res) => {
  const { bedId } = req.params;
  const { patientId, notes } = req.body;

  await executeQuery('UPDATE PATIENT_BEDS SET STATUS = \'DISCHARGED\', DISCHARGE_DATE = CURRENT_TIMESTAMP WHERE BED_ID = $1 AND STATUS = \'ACTIVE\'', [parseInt(bedId)]);

  const result = await executeQuery(
    `INSERT INTO PATIENT_BEDS (PATIENT_ID, BED_ID, ASSIGNED_DATE, NOTES, STATUS) 
     VALUES ($1, $2, CURRENT_TIMESTAMP, $3, 'ACTIVE') 
     RETURNING ASSIGNMENT_ID`,
    [
      parseInt(patientId),
      parseInt(bedId),
      notes || null
    ]
  );

  const assignmentId = result.rows[0].ASSIGNMENT_ID;

  await executeQuery('UPDATE BEDS SET STATUS = \'OCCUPIED\' WHERE BED_ID = $1', [parseInt(bedId)]);
  await executeQuery('UPDATE PATIENTS SET STATUS = \'INPATIENT\' WHERE PATIENT_ID = $1', [parseInt(patientId)]);

  res.json({
    success: true,
    message: 'Bed assigned successfully',
    data: { assignmentId }
  });
});

/**
 * @desc    Discharge patient from bed
 * @route   POST /api/rooms/beds/:bedId/discharge
 * @access  Private
 */
const dischargePatient = asyncHandler(async (req, res) => {
  const { bedId } = req.params;
  const { notes } = req.body;

  // Get patient ID from active bed assignment
  const assignmentResult = await executeQuery(
    `SELECT PATIENT_ID FROM PATIENT_BEDS 
     WHERE BED_ID = $1 AND STATUS = 'ACTIVE'`,
    [parseInt(bedId)]
  );

  if (assignmentResult.rows.length === 0) {
    throw new APIError('No active patient assignment found for this bed', 404, 'NO_ACTIVE_ASSIGNMENT');
  }

  const patientId = assignmentResult.rows[0].PATIENT_ID;

  const bedResult = await executeQuery(`SELECT BED_ID FROM PATIENT_BEDS WHERE PATIENT_ID = $1 AND STATUS = 'ACTIVE'`, [patientId]);
  if (bedResult.rows.length > 0) {
    const assignedBedId = bedResult.rows[0].BED_ID;
    await executeQuery(`UPDATE PATIENT_BEDS SET STATUS = 'DISCHARGED', DISCHARGE_DATE = CURRENT_TIMESTAMP, NOTES = COALESCE($1, NOTES) WHERE PATIENT_ID = $2 AND STATUS = 'ACTIVE'`, [notes || null, patientId]);
    await executeQuery(`UPDATE BEDS SET STATUS = 'AVAILABLE' WHERE BED_ID = $1`, [assignedBedId]);
  }
  await executeQuery(`UPDATE PATIENTS SET STATUS = 'OUTPATIENT', DISCHARGE_DATE = CURRENT_TIMESTAMP WHERE PATIENT_ID = $1`, [patientId]);

  res.json({
    success: true,
    message: 'Patient discharged successfully'
  });
});

/**
 * @desc    Get bed occupancy statistics
 * @route   GET /api/rooms/statistics
 * @access  Private
 */
const getRoomStatistics = asyncHandler(async (req, res) => {
  const statsResult = await executeQuery(
    `SELECT 
      (SELECT COUNT(*) FROM ROOMS) as total_rooms,
      (SELECT COUNT(*) FROM ROOMS WHERE STATUS = 'AVAILABLE') as available_rooms,
      (SELECT COUNT(*) FROM ROOMS WHERE STATUS = 'OCCUPIED') as occupied_rooms,
      (SELECT COUNT(*) FROM BEDS) as total_beds,
      (SELECT COUNT(*) FROM BEDS WHERE STATUS = 'AVAILABLE') as available_beds,
      (SELECT COUNT(*) FROM BEDS WHERE STATUS = 'OCCUPIED') as occupied_beds,
      (SELECT COUNT(*) FROM PATIENTS WHERE STATUS = 'INPATIENT') as total_inpatients`
  );

  const byRoomType = await executeQuery(
    `SELECT 
      ROOM_TYPE,
      COUNT(*) as room_count,
      (SELECT COUNT(*) FROM BEDS B JOIN ROOMS R2 ON B.ROOM_ID = R2.ROOM_ID WHERE R2.ROOM_TYPE = R.ROOM_TYPE) as bed_count,
      (SELECT COUNT(*) FROM BEDS B JOIN ROOMS R2 ON B.ROOM_ID = R2.ROOM_ID WHERE R2.ROOM_TYPE = R.ROOM_TYPE AND B.STATUS = 'OCCUPIED') as occupied_count
     FROM ROOMS R
     GROUP BY ROOM_TYPE`
  );

  res.json({
    success: true,
    data: {
      overall: statsResult.rows[0],
      byRoomType: byRoomType.rows.map(row => ({
        roomType: row.ROOM_TYPE,
        roomCount: row.ROOM_COUNT,
        bedCount: row.BED_COUNT,
        occupiedCount: row.OCCUPIED_COUNT,
        occupancyRate: row.BED_COUNT > 0 ? Math.round((row.OCCUPIED_COUNT / row.BED_COUNT) * 100) : 0
      }))
    }
  });
});

module.exports = {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  getBeds,
  assignBed,
  dischargePatient,
  getRoomStatistics
};
