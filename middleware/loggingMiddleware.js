/**
 * Logging Middleware for Express
 * Automatically logs API requests and responses
 */

const logger = require('../utils/logger');

/**
 * Generate unique trace ID for request tracking
 */
const generateTraceId = () => {
  return `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Request logging middleware
 * Logs incoming API requests with metadata
 */
const requestLogger = (req, res, next) => {
  // Skip logging for health checks and static assets
  if (req.path === '/health' || req.path.startsWith('/static')) {
    return next();
  }

  // Generate trace ID for this request
  req.traceId = req.headers['x-trace-id'] || generateTraceId();
  res.setHeader('X-Trace-Id', req.traceId);

  // Record request start time
  req.startTime = Date.now();

  // Log API request
  logger.apiRequest(req);

  // Capture original end function
  const originalEnd = res.end;

  // Override end function to log response
  res.end = function(chunk, encoding) {
    // Calculate response time
    const responseTime = Date.now() - req.startTime;

    // Log API response
    logger.apiResponse(req, res, { responseTime });

    // Call original end function
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

/**
 * Error logging middleware
 * Logs errors that occur during request processing
 */
const errorLogger = (err, req, res, next) => {
  // Log error details
  logger.error('API Error', {
    method: req.method,
    path: req.path,
    error: err.message,
    stack: err.stack,
    userId: req.user?._id || req.user?.id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  // Log activity if ActivityLog is available
  const ActivityLog = require('../models/ActivityLog');
  ActivityLog.create({
    action: `api_error_${req.method.toLowerCase()}_${req.path.replace(/\//g, '_')}`,
    category: 'api',
    userId: req.user?._id || req.user?.id,
    userRole: req.user?.userType,
    endpoint: `${req.method} ${req.path}`,
    status: 'failed',
    error: {
      message: err.message,
      code: err.code || 'INTERNAL_ERROR',
      stack: err.stack
    },
    traceId: req.traceId || generateTraceId(),
    ipAddress: req.ip || req.connection?.remoteAddress,
    userAgent: req.headers['user-agent'],
    timestampUTC: new Date()
  }).catch(logErr => {
    // Fail silently if activity log creation fails
    console.error('Failed to create activity log:', logErr.message);
  });

  next(err);
};

module.exports = {
  requestLogger,
  errorLogger
};
