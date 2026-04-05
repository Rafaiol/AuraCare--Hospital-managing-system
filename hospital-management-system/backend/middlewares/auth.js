/**
 * Authentication & Authorization Middleware
 * Implements JWT validation and Role-Based Access Control (RBAC)
 */
const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here';

/**
 * Verify JWT token from Authorization header
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.substring(7);

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Fetch user details from database
    const userResult = await executeQuery(
      `SELECT U.USER_ID, U.USERNAME, U.EMAIL, U.FIRST_NAME, U.LAST_NAME, 
              U.STATUS, U.ROLE_ID, R.ROLE_NAME, R.PERMISSIONS
       FROM USERS U
       JOIN ROLES R ON U.ROLE_ID = R.ROLE_ID
       WHERE U.USER_ID = $1 AND U.STATUS = 'ACTIVE'`,
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    const user = userResult.rows[0];

    // Attach user info to request
    req.user = {
      userId: user.USER_ID,
      username: user.USERNAME,
      email: user.EMAIL,
      firstName: user.FIRST_NAME,
      lastName: user.LAST_NAME,
      roleId: user.ROLE_ID,
      roleName: user.ROLE_NAME,
      permissions: JSON.parse(user.PERMISSIONS || '[]')
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

/**
 * Check if user has required role(s)
 * @param {...string} allowedRoles - Allowed roles
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.roleName)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

/**
 * Check if user has required permission(s)
 * @param {...string} requiredPermissions - Required permissions
 */
const requirePermission = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userPermissions = req.user.permissions;

    // Admin has all permissions
    if (userPermissions.includes('all')) {
      return next();
    }

    const hasPermission = requiredPermissions.every(perm =>
      userPermissions.includes(perm)
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Missing required permissions.'
      });
    }

    next();
  };
};

/**
 * Optional authentication - attaches user if token exists, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);

    const userResult = await executeQuery(
      `SELECT U.USER_ID, U.USERNAME, U.EMAIL, U.FIRST_NAME, U.LAST_NAME, 
              U.STATUS, U.ROLE_ID, R.ROLE_NAME
       FROM USERS U
       JOIN ROLES R ON U.ROLE_ID = R.ROLE_ID
       WHERE U.USER_ID = $1 AND U.STATUS = 'ACTIVE'`,
      [decoded.userId]
    );

    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      req.user = {
        userId: user.USER_ID,
        username: user.USERNAME,
        email: user.EMAIL,
        firstName: user.FIRST_NAME,
        lastName: user.LAST_NAME,
        roleId: user.ROLE_ID,
        roleName: user.ROLE_NAME
      };
    }

    next();
  } catch (error) {
    // Continue without user info
    next();
  }
};

/**
 * Generate JWT tokens
 */
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  return { accessToken, refreshToken };
};

module.exports = {
  authenticate,
  authorize,
  requirePermission,
  optionalAuth,
  generateTokens,
  JWT_SECRET
};
