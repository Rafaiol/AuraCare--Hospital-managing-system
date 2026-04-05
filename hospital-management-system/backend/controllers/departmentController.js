/**
 * Department Controller
 */
const { executeQuery } = require('../config/database');
const { APIError, asyncHandler } = require('../middlewares/errorHandler');

/**
 * @desc  Get all departments
 * @route GET /api/departments
 */
const getDepartments = asyncHandler(async (req, res) => {
  const result = await executeQuery(
    `SELECT 
       D.DEPT_ID, D.DEPT_NAME, D.DEPT_CODE, D.DESCRIPTION,
       D.CREATED_AT,
       COUNT(DR.DOCTOR_ID) AS DOCTOR_COUNT
     FROM DEPARTMENTS D
     LEFT JOIN DOCTORS DR ON DR.DEPT_ID = D.DEPT_ID AND DR.STATUS = 'ACTIVE'
     GROUP BY D.DEPT_ID, D.DEPT_NAME, D.DEPT_CODE, D.DESCRIPTION, D.CREATED_AT
     ORDER BY D.DEPT_NAME`
  );

  const departments = result.rows.map(row => ({
    departmentId: row.DEPT_ID,
    name: row.DEPT_NAME,
    code: row.DEPT_CODE,
    description: row.DESCRIPTION,
    doctorCount: Number(row.DOCTOR_COUNT),
    createdAt: row.CREATED_AT
  }));

  res.json({ success: true, data: departments });
});

/**
 * @desc  Get department by ID
 * @route GET /api/departments/:id
 */
const getDepartmentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await executeQuery(
    `SELECT DEPT_ID, DEPT_NAME, DEPT_CODE, DESCRIPTION, CREATED_AT
     FROM DEPARTMENTS WHERE DEPT_ID = $1`,
    [parseInt(id)]
  );
  if (result.rows.length === 0) {
    throw new APIError('Department not found', 404, 'DEPT_NOT_FOUND');
  }
  const row = result.rows[0];
  res.json({
    success: true,
    data: {
      departmentId: row.DEPT_ID,
      name: row.DEPT_NAME,
      code: row.DEPT_CODE,
      description: row.DESCRIPTION,
      createdAt: row.CREATED_AT
    }
  });
});

/**
 * @desc  Create department
 * @route POST /api/departments
 */
const createDepartment = asyncHandler(async (req, res) => {
  const { name, code, description } = req.body;
  if (!name) throw new APIError('Department name is required', 400, 'MISSING_NAME');

  const generatedCode = code || name.substring(0, 3).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();

  await executeQuery(
    `INSERT INTO DEPARTMENTS (DEPT_NAME, DEPT_CODE, DESCRIPTION)
     VALUES ($1, $2, $3)`,
    [name, generatedCode, description || null]
  );

  res.status(201).json({ success: true, message: 'Department created successfully' });
});

/**
 * @desc  Update department
 * @route PUT /api/departments/:id
 */
const updateDepartment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, code, description } = req.body;

  const check = await executeQuery(
    'SELECT DEPT_ID FROM DEPARTMENTS WHERE DEPT_ID = $1',
    [parseInt(id)]
  );
  if (check.rows.length === 0) {
    throw new APIError('Department not found', 404, 'DEPT_NOT_FOUND');
  }

  const generatedCode = code || name.substring(0, 3).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();

  await executeQuery(
    `UPDATE DEPARTMENTS SET
       DEPT_NAME = $1,
       DEPT_CODE = $2,
       DESCRIPTION = $3
     WHERE DEPT_ID = $4`,
    [name, generatedCode, description || null, parseInt(id)]
  );

  res.json({ success: true, message: 'Department updated successfully' });
});

/**
 * @desc  Delete department
 * @route DELETE /api/departments/:id
 */
const deleteDepartment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const check = await executeQuery(
    'SELECT DEPT_ID FROM DEPARTMENTS WHERE DEPT_ID = $1',
    [parseInt(id)]
  );
  if (check.rows.length === 0) {
    throw new APIError('Department not found', 404, 'DEPT_NOT_FOUND');
  }

  await executeQuery(
    'DELETE FROM DEPARTMENTS WHERE DEPT_ID = $1',
    [parseInt(id)]
  );

  res.json({ success: true, message: 'Department deleted successfully' });
});

module.exports = { getDepartments, getDepartmentById, createDepartment, updateDepartment, deleteDepartment };
