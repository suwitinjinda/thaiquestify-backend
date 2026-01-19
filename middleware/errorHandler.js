/**
 * Global Error Handler Middleware
 * Handles all errors in a centralized way with proper logging
 */

const logger = require('../utils/logger');

/**
 * Error handler middleware
 * Should be the last middleware in the Express app
 */
const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error('Unhandled Error', {
    method: req.method,
    path: req.path,
    error: err.message,
    stack: err.stack,
    userId: req.user?._id || req.user?.id,
    ipAddress: req.ip,
    body: req.body,
    query: req.query
  });

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // Determine error message
  let message = err.message || 'Internal Server Error';
  
  // In production, hide sensitive error details
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Internal Server Error';
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors automatically
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Custom error class
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  errorHandler,
  asyncHandler,
  AppError
};
