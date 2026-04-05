/**
 * Authentication Controller
 * Handles user login, registration, and token management
 */
const bcrypt = require('bcryptjs');
const { executeQuery } = require('../config/database');
const { generateTokens } = require('../middlewares/auth');
const { APIError, asyncHandler } = require('../middlewares/errorHandler');

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user by email with role info
  const userResult = await executeQuery(
    `SELECT U.USER_ID, U.USERNAME, U.EMAIL, U.PASSWORD_HASH, U.FIRST_NAME, U.LAST_NAME, 
            U.PHONE, U.STATUS, U.PROFILE_IMAGE, U.LAST_LOGIN, U.CREATED_AT,
            R.ROLE_ID, R.ROLE_NAME, R.PERMISSIONS
     FROM USERS U
     JOIN ROLES R ON U.ROLE_ID = R.ROLE_ID
     WHERE U.EMAIL = $1`,
    [email.toLowerCase()]
  );

  if (userResult.rows.length === 0) {
    throw new APIError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const user = userResult.rows[0];

  // Check if user is active
  if (user.STATUS !== 'ACTIVE') {
    throw new APIError('Account is not active. Please contact administrator.', 403, 'ACCOUNT_INACTIVE');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.PASSWORD_HASH);

  if (!isPasswordValid) {
    throw new APIError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  // Update last login
  await executeQuery(
    'UPDATE USERS SET LAST_LOGIN = CURRENT_TIMESTAMP WHERE USER_ID = $1',
    [user.USER_ID]
  );

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.USER_ID);

  // Remove sensitive data from response
  const userResponse = {
    userId: user.USER_ID,
    username: user.USERNAME,
    email: user.EMAIL,
    firstName: user.FIRST_NAME,
    lastName: user.LAST_NAME,
    fullName: `${user.FIRST_NAME} ${user.LAST_NAME}`,
    phone: user.PHONE,
    status: user.STATUS,
    profileImage: user.PROFILE_IMAGE,
    lastLogin: user.LAST_LOGIN,
    createdAt: user.CREATED_AT,
    role: {
      roleId: user.ROLE_ID,
      roleName: user.ROLE_NAME,
      permissions: JSON.parse(user.PERMISSIONS || '[]')
    }
  };

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: userResponse,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 86400 // 24 hours in seconds
      }
    }
  });
});

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public (Admin can register users with roles)
 */
const register = asyncHandler(async (req, res) => {
  const { username, email, password, firstName, lastName, phone, roleId = 4 } = req.body;

  // Check if email already exists
  const emailCheck = await executeQuery(
    'SELECT USER_ID FROM USERS WHERE EMAIL = $1',
    [email.toLowerCase()]
  );

  if (emailCheck.rows.length > 0) {
    throw new APIError('Email already registered', 409, 'EMAIL_EXISTS');
  }

  // Check if username already exists
  const usernameCheck = await executeQuery(
    'SELECT USER_ID FROM USERS WHERE USERNAME = $1',
    [username.toLowerCase()]
  );

  if (usernameCheck.rows.length > 0) {
    throw new APIError('Username already taken', 409, 'USERNAME_EXISTS');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Insert new user
  const result = await executeQuery(
    `INSERT INTO USERS (USERNAME, EMAIL, PASSWORD_HASH, FIRST_NAME, LAST_NAME, PHONE, ROLE_ID)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING USER_ID`,
    [
      username.toLowerCase(),
      email.toLowerCase(),
      passwordHash,
      firstName,
      lastName,
      phone,
      roleId
    ]
  );

  const userId = result.rows[0].USER_ID;

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(userId);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      userId,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      firstName,
      lastName,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 86400
      }
    }
  });
});

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh
 * @access  Public
 */
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new APIError('Refresh token is required', 400, 'MISSING_REFRESH_TOKEN');
  }

  try {
    const jwt = require('jsonwebtoken');
    const { JWT_SECRET } = require('../middlewares/auth');

    const decoded = jwt.verify(refreshToken, JWT_SECRET);

    if (decoded.type !== 'refresh') {
      throw new APIError('Invalid refresh token', 401, 'INVALID_TOKEN_TYPE');
    }

    // Check if user still exists and is active
    const userResult = await executeQuery(
      'SELECT USER_ID, STATUS FROM USERS WHERE USER_ID = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      throw new APIError('User not found', 404, 'USER_NOT_FOUND');
    }

    if (userResult.rows[0].STATUS !== 'ACTIVE') {
      throw new APIError('Account is not active', 403, 'ACCOUNT_INACTIVE');
    }

    // Generate new tokens
    const tokens = generateTokens(decoded.userId);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        tokens: {
          ...tokens,
          expiresIn: 86400
        }
      }
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new APIError('Refresh token expired. Please login again.', 401, 'TOKEN_EXPIRED');
    }
    throw new APIError('Invalid refresh token', 401, 'INVALID_TOKEN');
  }
});

/**
 * @desc    Get all users (Admin only)
 * @route   GET /api/auth/users
 * @access  Private/Admin
 */
const getUsers = asyncHandler(async (req, res) => {
  const query = `
    SELECT U.USER_ID, U.USERNAME, U.EMAIL, U.FIRST_NAME, U.LAST_NAME, 
           U.PHONE, U.STATUS, U.CREATED_AT, R.ROLE_NAME
    FROM USERS U
    JOIN ROLES R ON U.ROLE_ID = R.ROLE_ID
    ORDER BY U.CREATED_AT DESC
  `;
  const result = await executeQuery(query);

  const users = result.rows.map(row => ({
    userId: row.USER_ID,
    username: row.USERNAME,
    email: row.EMAIL,
    firstName: row.FIRST_NAME,
    lastName: row.LAST_NAME,
    phone: row.PHONE,
    status: row.STATUS,
    createdAt: row.CREATED_AT,
    roleName: row.ROLE_NAME
  }));

  res.json({ success: true, count: users.length, data: users });
});

/**
 * @desc    Update a user's role and status (Admin only)
 * @route   PUT /api/auth/users/:id
 * @access  Private/Admin
 */
const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { roleName, status } = req.body;
  let params = [parseInt(id)];
  let paramIndex = 2;
  let updates = [];

  if (roleName) {
    const roleResult = await executeQuery(`SELECT ROLE_ID FROM ROLES WHERE ROLE_NAME = $1`, [roleName]);
    if (roleResult.rows.length === 0) {
      throw new APIError('Invalid role name', 400, 'INVALID_ROLE_NAME');
    }
    updates.push(`ROLE_ID = $${paramIndex++}`);
    params.push(roleResult.rows[0].ROLE_ID);
  }

  if (status) {
    updates.push(`STATUS = $${paramIndex++}`);
    params.push(status);
  }

  if (updates.length === 0) {
    throw new APIError('No fields to update', 400, 'NO_UPDATE_FIELDS');
  }

  const updateQuery = `UPDATE USERS SET ${updates.join(', ')} WHERE USER_ID = $1`;
  const result = await executeQuery(updateQuery, params);

  // Synchronize status with profile tables if status is updated
  if (status) {
    try {
      // Update Doctors if they exist for this user
      await executeQuery(
        'UPDATE DOCTORS SET STATUS = $1 WHERE USER_ID = $2',
        [status.toUpperCase(), parseInt(id)]
      );
      // Update Patients if they exist for this user
      await executeQuery(
        'UPDATE PATIENTS SET STATUS = $1 WHERE USER_ID = $2',
        [status.toUpperCase(), parseInt(id)]
      );
    } catch (syncError) {
      console.error('Failed to sync status to profile tables:', syncError);
      // We don't throw here to ensure the user update still succeeds
    }
  }

  // Notice postgres returns rowCount, whereas our executeQuery might map it to rowsAffected
  if (result.rowsAffected === 0 && result.rowCount === 0) {
    throw new APIError('User not found', 404, 'USER_NOT_FOUND');
  }

  res.json({ success: true, message: 'User updated successfully' });
});

/**
 * @desc    Update a user's personal info (Admin only)
 * @route   PUT /api/auth/users/:id/info
 * @access  Private/Admin
 */
const updateUserInfo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, email, phone } = req.body;

  let params = [parseInt(id)];
  let paramIndex = 2;
  let updates = [];

  if (firstName !== undefined) {
    updates.push(`FIRST_NAME = $${paramIndex++}`);
    params.push(firstName);
  }
  if (lastName !== undefined) {
    updates.push(`LAST_NAME = $${paramIndex++}`);
    params.push(lastName);
  }
  if (email !== undefined) {
    // Check if new email is already taken by someone else
    const emailCheck = await executeQuery(
      'SELECT USER_ID FROM USERS WHERE EMAIL = $1 AND USER_ID != $2',
      [email.toLowerCase(), parseInt(id)]
    );
    if (emailCheck.rows.length > 0) {
      throw new APIError('Email already in use by another user', 409, 'EMAIL_EXISTS');
    }
    updates.push(`EMAIL = $${paramIndex++}`);
    params.push(email.toLowerCase());
  }
  if (phone !== undefined) {
    updates.push(`PHONE = $${paramIndex++}`);
    params.push(phone);
  }

  if (updates.length === 0) {
    throw new APIError('No fields to update', 400, 'NO_UPDATE_FIELDS');
  }

  const updateQuery = `UPDATE USERS SET ${updates.join(', ')} WHERE USER_ID = $1`;
  const result = await executeQuery(updateQuery, params);

  if (result.rowsAffected === 0 && result.rowCount === 0) {
    throw new APIError('User not found', 404, 'USER_NOT_FOUND');
  }

  res.json({ success: true, message: 'User info updated successfully' });
});

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/profile
 * @access  Private
 */
const getProfile = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const userResult = await executeQuery(
    `SELECT U.USER_ID, U.USERNAME, U.EMAIL, U.FIRST_NAME, U.LAST_NAME, 
            U.PHONE, U.STATUS, U.PROFILE_IMAGE, U.LAST_LOGIN, U.CREATED_AT,
            R.ROLE_ID, R.ROLE_NAME, R.PERMISSIONS
     FROM USERS U
     JOIN ROLES R ON U.ROLE_ID = R.ROLE_ID
     WHERE U.USER_ID = $1`,
    [userId]
  );

  if (userResult.rows.length === 0) {
    throw new APIError('User not found', 404, 'USER_NOT_FOUND');
  }

  const user = userResult.rows[0];

  res.json({
    success: true,
    data: {
      userId: user.USER_ID,
      username: user.USERNAME,
      email: user.EMAIL,
      firstName: user.FIRST_NAME,
      lastName: user.LAST_NAME,
      fullName: `${user.FIRST_NAME} ${user.LAST_NAME}`,
      phone: user.PHONE,
      status: user.STATUS,
      profileImage: user.PROFILE_IMAGE,
      lastLogin: user.LAST_LOGIN,
      createdAt: user.CREATED_AT,
      role: {
        roleId: user.ROLE_ID,
        roleName: user.ROLE_NAME,
        permissions: JSON.parse(user.PERMISSIONS || '[]')
      }
    }
  });
});

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { firstName, lastName, phone, profileImage } = req.body;

  // Build dynamic update query
  const updates = [];
  const params = [userId];
  let paramIndex = 2;

  if (firstName !== undefined) {
    updates.push(`FIRST_NAME = $${paramIndex++}`);
    params.push(firstName);
  }

  if (lastName !== undefined) {
    updates.push(`LAST_NAME = $${paramIndex++}`);
    params.push(lastName);
  }

  if (phone !== undefined) {
    updates.push(`PHONE = $${paramIndex++}`);
    params.push(phone);
  }

  if (profileImage !== undefined) {
    updates.push(`PROFILE_IMAGE = $${paramIndex++}`);
    params.push(profileImage);
  }

  if (updates.length === 0) {
    throw new APIError('No fields to update', 400, 'NO_UPDATE_FIELDS');
  }

  const updateSql = `UPDATE USERS SET ${updates.join(', ')} WHERE USER_ID = $1`;

  await executeQuery(updateSql, params);

  res.json({
    success: true,
    message: 'Profile updated successfully'
  });
});

/**
 * @desc    Change password
 * @route   POST /api/auth/change-password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { currentPassword, newPassword } = req.body;

  // Get current password hash
  const userResult = await executeQuery(
    'SELECT PASSWORD_HASH FROM USERS WHERE USER_ID = $1',
    [userId]
  );

  if (userResult.rows.length === 0) {
    throw new APIError('User not found', 404, 'USER_NOT_FOUND');
  }

  // Verify current password
  const isCurrentValid = await bcrypt.compare(currentPassword, userResult.rows[0].PASSWORD_HASH);

  if (!isCurrentValid) {
    throw new APIError('Current password is incorrect', 401, 'INVALID_PASSWORD');
  }

  // Hash new password
  const newPasswordHash = await bcrypt.hash(newPassword, 10);

  // Update password
  await executeQuery(
    'UPDATE USERS SET PASSWORD_HASH = $1 WHERE USER_ID = $2',
    [newPasswordHash, userId]
  );

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

/**
 * @desc    Logout user (client-side token removal)
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  // In a stateless JWT setup, logout is handled client-side
  // Optionally, you could implement a token blacklist here

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = {
  login,
  register,
  refreshToken,
  getProfile,
  updateProfile,
  changePassword,
  logout,
  getUsers,
  updateUserRole,
  updateUserInfo
};
