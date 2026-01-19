/**
 * Centralized Logging System for Thaiquestify Backend
 * 
 * This logger provides structured logging for:
 * - Application logs (info, error, warn, debug)
 * - User activity logs (stored in database)
 * - API request/response logs
 * - System events and errors
 * 
 * Usage:
 *   const logger = require('./utils/logger');
 *   logger.info('User logged in', { userId: '123' });
 *   logger.activity('job_created', { userId: '123', jobId: '456' });
 */

const fs = require('fs');
const path = require('path');

// Log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Current log level (can be set via environment variable)
const CURRENT_LOG_LEVEL = process.env.LOG_LEVEL 
  ? LOG_LEVELS[process.env.LOG_LEVEL.toUpperCase()] || LOG_LEVELS.INFO
  : (process.env.NODE_ENV === 'production' ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG);

// Log directory
const LOG_DIR = path.join(__dirname, '../logs');
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Log file paths
const LOG_FILES = {
  error: path.join(LOG_DIR, 'error.log'),
  combined: path.join(LOG_DIR, 'combined.log'),
  activity: path.join(LOG_DIR, 'activity.log')
};

/**
 * Format log message with timestamp and metadata
 */
function formatLogMessage(level, message, metadata = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level: level.toUpperCase(),
    message,
    ...metadata
  };
  
  return JSON.stringify(logEntry);
}

/**
 * Write log to file
 */
function writeToFile(filename, content) {
  try {
    fs.appendFileSync(filename, content + '\n', 'utf8');
  } catch (error) {
    console.error('Failed to write to log file:', error.message);
  }
}

/**
 * Get console color code for log levels
 */
function getColorCode(level) {
  const colors = {
    error: '\x1b[31m', // Red
    warn: '\x1b[33m',  // Yellow
    info: '\x1b[36m',  // Cyan
    debug: '\x1b[90m', // Gray
    reset: '\x1b[0m'
  };
  return colors[level] || colors.reset;
}

/**
 * Format log for console output (colorful)
 */
function formatConsoleLog(level, message, metadata = {}) {
  const timestamp = new Date().toISOString();
  const color = getColorCode(level);
  const reset = '\x1b[0m';
  
  let output = `${color}[${timestamp}] [${level.toUpperCase()}]${reset} ${message}`;
  
  if (Object.keys(metadata).length > 0) {
    output += ` ${JSON.stringify(metadata)}`;
  }
  
  return output;
}

/**
 * Main Logger Class
 */
class Logger {
  /**
   * Log error messages
   */
  error(message, metadata = {}) {
    if (CURRENT_LOG_LEVEL >= LOG_LEVELS.ERROR) {
      const logMessage = formatLogMessage('error', message, metadata);
      const consoleMessage = formatConsoleLog('error', message, metadata);
      
      console.error(consoleMessage);
      writeToFile(LOG_FILES.error, logMessage);
      writeToFile(LOG_FILES.combined, logMessage);
    }
  }

  /**
   * Log warning messages
   */
  warn(message, metadata = {}) {
    if (CURRENT_LOG_LEVEL >= LOG_LEVELS.WARN) {
      const logMessage = formatLogMessage('warn', message, metadata);
      const consoleMessage = formatConsoleLog('warn', message, metadata);
      
      console.warn(consoleMessage);
      writeToFile(LOG_FILES.combined, logMessage);
    }
  }

  /**
   * Log informational messages
   */
  info(message, metadata = {}) {
    if (CURRENT_LOG_LEVEL >= LOG_LEVELS.INFO) {
      const logMessage = formatLogMessage('info', message, metadata);
      const consoleMessage = formatConsoleLog('info', message, metadata);
      
      console.log(consoleMessage);
      writeToFile(LOG_FILES.combined, logMessage);
    }
  }

  /**
   * Log debug messages
   */
  debug(message, metadata = {}) {
    if (CURRENT_LOG_LEVEL >= LOG_LEVELS.DEBUG) {
      const logMessage = formatLogMessage('debug', message, metadata);
      const consoleMessage = formatConsoleLog('debug', message, metadata);
      
      console.log(consoleMessage);
      writeToFile(LOG_FILES.combined, logMessage);
    }
  }

  /**
   * Log user activity (stored in database and file)
   */
  async activity(action, metadata = {}) {
    const logMessage = formatLogMessage('activity', action, metadata);
    writeToFile(LOG_FILES.activity, logMessage);
    
    // Also log to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(formatConsoleLog('info', `[ACTIVITY] ${action}`, metadata));
    }
    
    // Store in database if ActivityLog model is available
    try {
      const ActivityLog = require('../models/ActivityLog');
      await ActivityLog.create({
        action,
        userId: metadata.userId,
        metadata: metadata,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent
      });
    } catch (error) {
      // ActivityLog model might not exist yet, just continue
      if (error.code !== 'MODULE_NOT_FOUND' && !error.message.includes('ActivityLog')) {
        this.warn('Failed to save activity log to database', { error: error.message, action });
      }
    }
  }

  /**
   * Log API requests
   */
  apiRequest(req, metadata = {}) {
    const apiMetadata = {
      method: req.method,
      path: req.path,
      query: req.query,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      userId: req.user?._id || req.user?.id,
      ...metadata
    };
    
    this.debug(`API Request: ${req.method} ${req.path}`, apiMetadata);
  }

  /**
   * Log API responses
   */
  apiResponse(req, res, metadata = {}) {
    const apiMetadata = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime: metadata.responseTime,
      userId: req.user?._id || req.user?.id,
      ...metadata
    };
    
    const level = res.statusCode >= 400 ? 'error' : res.statusCode >= 300 ? 'warn' : 'info';
    this[level](`API Response: ${req.method} ${req.path} - ${res.statusCode}`, apiMetadata);
  }

  /**
   * Log database operations
   */
  db(operation, model, metadata = {}) {
    this.debug(`DB ${operation}: ${model}`, metadata);
  }

  /**
   * Log system events
   */
  system(event, metadata = {}) {
    this.info(`[SYSTEM] ${event}`, metadata);
  }

  /**
   * Log security events (authentication, authorization)
   */
  security(event, metadata = {}) {
    const securityMetadata = {
      ...metadata,
      ip: metadata.ip || metadata.ipAddress,
      userAgent: metadata.userAgent
    };
    
    this.warn(`[SECURITY] ${event}`, securityMetadata);
    writeToFile(LOG_FILES.error, formatLogMessage('security', event, securityMetadata));
  }

  /**
   * Log business logic events (jobs, quests, payments)
   */
  business(event, metadata = {}) {
    this.info(`[BUSINESS] ${event}`, metadata);
    writeToFile(LOG_FILES.activity, formatLogMessage('business', event, metadata));
  }
}

// Export singleton instance
module.exports = new Logger();
