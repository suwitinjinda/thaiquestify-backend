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

// Paths to skip request/response logging (noise reduction)
const SKIP_LOG_PATHS = ['/', '/favicon.ico', '/sitemap.xml', '/api/health'];

/**
 * Request logging middleware
 * - Skips noisy paths (/, favicon, sitemap, health)
 * - Default: only logs 4xx/5xx responses (errors). Set LOG_REQUESTS=1 for full request/response logs
 */
const requestLogger = (req, res, next) => {
  if (req.path === '/health' || req.path.startsWith('/static') || SKIP_LOG_PATHS.includes(req.path)) {
    return next();
  }

  req.traceId = req.headers['x-trace-id'] || generateTraceId();
  res.setHeader('X-Trace-Id', req.traceId);
  req.startTime = Date.now();

  const logAll = process.env.LOG_REQUESTS === '1';

  if (logAll) {
    logger.apiRequest(req);
  }

  const originalEnd = res.end;
  res.end = function (chunk, encoding) {
    const responseTime = Date.now() - req.startTime;
    // Only log 4xx/5xx by default; full logs when LOG_REQUESTS=1
    if (logAll || res.statusCode >= 400) {
      logger.apiResponse(req, res, { responseTime });
    }
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
