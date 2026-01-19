/**
 * Audit Logger Utility
 * Helper functions for creating standardized audit log entries
 */

const ActivityLog = require('../models/ActivityLog');
const crypto = require('crypto');

/**
 * Generate unique trace ID
 */
const generateTraceId = () => {
  return `trace-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
};

/**
 * Create audit log entry with all required fields
 * @param {Object} options - Audit log options
 * @param {string} options.action - Action type (login, create, update, delete)
 * @param {string} options.category - Category (auth, job, quest, etc.)
 * @param {ObjectId} options.userId - User ID who performed the action
 * @param {string} options.userRole - User role (admin, customer, partner, etc.)
 * @param {string} options.endpoint - API endpoint (e.g., "POST /api/jobs")
 * @param {ObjectId} options.objectId - Object ID affected (optional)
 * @param {Object} options.beforeValue - Before value for updates (optional)
 * @param {Object} options.afterValue - After value for updates (optional)
 * @param {string} options.status - Status (success, failed, pending, cancelled)
 * @param {Object} options.error - Error object with message, code, stack (optional)
 * @param {string} options.traceId - Request trace ID (optional, will generate if not provided)
 * @param {string} options.ipAddress - Source IP address
 * @param {string} options.userAgent - User agent string
 * @param {Object} options.metadata - Additional metadata (optional)
 */
const createAuditLog = async (options) => {
  try {
    const {
      action,
      category,
      userId,
      userRole,
      endpoint,
      objectId,
      beforeValue,
      afterValue,
      status = 'success',
      error,
      traceId,
      ipAddress,
      userAgent,
      metadata = {}
    } = options;

    if (!action || !category) {
      console.error('❌ Audit log requires action and category');
      return null;
    }

    const auditLog = {
      action,
      category,
      endpoint: endpoint || 'N/A',
      status,
      traceId: traceId || generateTraceId(),
      timestampUTC: new Date(),
      ipAddress: ipAddress || 'N/A',
      userAgent: userAgent || 'N/A',
      metadata
    };

    if (userId) {
      auditLog.userId = userId;
    }

    if (userRole) {
      auditLog.userRole = userRole;
    }

    if (objectId) {
      auditLog.objectId = objectId;
    }

    if (beforeValue !== undefined) {
      auditLog.beforeValue = beforeValue;
    }

    if (afterValue !== undefined) {
      auditLog.afterValue = afterValue;
    }

    if (error) {
      auditLog.error = {
        message: error.message || error,
        code: error.code || 'UNKNOWN_ERROR',
        stack: error.stack
      };
    }

    const log = await ActivityLog.create(auditLog);
    return log;
  } catch (err) {
    console.error('❌ Failed to create audit log:', err.message);
    return null;
  }
};

/**
 * Log login event
 */
const logLogin = async (req, user, method = 'unknown') => {
  return createAuditLog({
    action: 'user_login',
    category: 'auth',
    userId: user._id,
    userRole: user.userType,
    endpoint: `${req.method} ${req.path}`,
    status: 'success',
    traceId: req.traceId,
    ipAddress: req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'],
    userAgent: req.headers['user-agent'],
    metadata: {
      method,
      email: user.email
    }
  });
};

/**
 * Log failed login attempt
 */
const logFailedLogin = async (req, email, reason, method = 'unknown') => {
  return createAuditLog({
    action: 'user_login_failed',
    category: 'security',
    endpoint: `${req.method} ${req.path}`,
    status: 'failed',
    error: {
      message: reason,
      code: reason.toUpperCase().replace(/\s+/g, '_')
    },
    traceId: req.traceId,
    ipAddress: req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'],
    userAgent: req.headers['user-agent'],
    metadata: {
      method,
      email,
      reason
    }
  });
};

/**
 * Log permission denied event
 */
const logPermissionDenied = async (req, user, resource, action) => {
  return createAuditLog({
    action: 'permission_denied',
    category: 'security',
    userId: user?._id,
    userRole: user?.userType,
    endpoint: `${req.method} ${req.path}`,
    status: 'failed',
    error: {
      message: `Permission denied: ${action} on ${resource}`,
      code: 'PERMISSION_DENIED'
    },
    traceId: req.traceId,
    ipAddress: req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'],
    userAgent: req.headers['user-agent'],
    metadata: {
      resource,
      action
    }
  });
};

/**
 * Log create action
 */
const logCreate = async (req, user, objectType, objectId, metadata = {}) => {
  return createAuditLog({
    action: `${objectType}_created`,
    category: objectType,
    userId: user?._id,
    userRole: user?.userType,
    endpoint: `${req.method} ${req.path}`,
    objectId,
    status: 'success',
    traceId: req.traceId,
    ipAddress: req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'],
    userAgent: req.headers['user-agent'],
    metadata
  });
};

/**
 * Log update action with before/after values
 */
const logUpdate = async (req, user, objectType, objectId, beforeValue, afterValue, metadata = {}) => {
  return createAuditLog({
    action: `${objectType}_updated`,
    category: objectType,
    userId: user?._id,
    userRole: user?.userType,
    endpoint: `${req.method} ${req.path}`,
    objectId,
    beforeValue,
    afterValue,
    status: 'success',
    traceId: req.traceId,
    ipAddress: req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'],
    userAgent: req.headers['user-agent'],
    metadata
  });
};

/**
 * Log delete action
 */
const logDelete = async (req, user, objectType, objectId, metadata = {}) => {
  return createAuditLog({
    action: `${objectType}_deleted`,
    category: objectType,
    userId: user?._id,
    userRole: user?.userType,
    endpoint: `${req.method} ${req.path}`,
    objectId,
    status: 'success',
    traceId: req.traceId,
    ipAddress: req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'],
    userAgent: req.headers['user-agent'],
    metadata
  });
};

module.exports = {
  createAuditLog,
  logLogin,
  logFailedLogin,
  logPermissionDenied,
  logCreate,
  logUpdate,
  logDelete,
  generateTraceId
};
