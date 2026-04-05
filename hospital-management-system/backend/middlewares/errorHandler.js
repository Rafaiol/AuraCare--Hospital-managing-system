/**
 * Global Error Handler Middleware
 * Centralized error handling for the application
 */

/**
 * Custom API Error class
 */
class APIError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async handler wrapper for controllers
 * Eliminates need for try-catch in every controller
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errorCode = err.code || 'INTERNAL_ERROR';

  // Log error for debugging
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    statusCode,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Handle specific error types
  
  // Oracle Database Errors
  if (err.message && err.message.includes('ORA-')) {
    const oraError = err.message.match(/ORA-\d+:\s*(.+)/);
    if (oraError) {
      // Map common Oracle errors
      if (err.message.includes('ORA-00001')) {
        statusCode = 409;
        message = 'Duplicate entry. This record already exists.';
        errorCode = 'DUPLICATE_ENTRY';
      } else if (err.message.includes('ORA-02291')) {
        statusCode = 400;
        message = 'Referenced record not found.';
        errorCode = 'FOREIGN_KEY_VIOLATION';
      } else if (err.message.includes('ORA-02292')) {
        statusCode = 400;
        message = 'Cannot delete record. It is referenced by other records.';
        errorCode = 'REFERENTIAL_INTEGRITY';
      } else if (err.message.includes('ORA-01400')) {
        statusCode = 400;
        message = 'Required field cannot be empty.';
        errorCode = 'NOT_NULL_VIOLATION';
      } else {
        statusCode = 400;
        message = 'Database error: ' + oraError[1];
        errorCode = 'DATABASE_ERROR';
      }
    }
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please login again.';
    errorCode = 'INVALID_TOKEN';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired. Please login again.';
    errorCode = 'TOKEN_EXPIRED';
  }

  // Validation Errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
    errorCode = 'VALIDATION_ERROR';
  }

  // Syntax Errors (JSON parsing)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Invalid JSON in request body';
    errorCode = 'INVALID_JSON';
  }

  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = 'File too large. Maximum size is 5MB.';
    errorCode = 'FILE_TOO_LARGE';
  }

  // Send error response
  const errorResponse = {
    success: false,
    message,
    code: errorCode,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err.message
    })
  };

  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    code: 'ROUTE_NOT_FOUND'
  });
};

module.exports = {
  APIError,
  asyncHandler,
  errorHandler,
  notFoundHandler
};
