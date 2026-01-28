// middleware/rateLimiter.js
// Rate limiting middleware for API protection

const rateLimit = require('express-rate-limit');

// Check if in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// Helper function to check if request has auth token
// This works BEFORE auth middleware runs, so we check the header directly
const hasAuthToken = (req) => {
  const authHeader = req.headers.authorization || req.headers['x-auth-token'];
  if (!authHeader) return false;
  
  // Check if it's a Bearer token or custom token format
  if (typeof authHeader === 'string') {
    // Bearer token format
    if (authHeader.startsWith('Bearer ')) return true;
    // Custom token formats (user-token-*, auto-login-*)
    if (authHeader.startsWith('user-token-') || authHeader.startsWith('auto-login-')) return true;
    // JWT-like tokens (long strings)
    if (authHeader.length > 50) return true;
  }
  
  return false;
};

// General API rate limiter
// - Development: 1000 requests/15 minutes (very lenient for testing)
// - Production: 100 requests/15 minutes per IP
// - Authenticated users (with token): Skip this limiter (use authenticatedLimiter instead)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 1000 : 100, // Higher limit in development
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting for authenticated users (they get higher limit via authenticatedLimiter)
  skip: (req) => {
    // Skip if request has auth token (authenticated users use authenticatedLimiter)
    const hasToken = hasAuthToken(req);
    if (hasToken) {
      console.log('🔓 Rate limiter: Skipping apiLimiter for authenticated request');
    }
    return hasToken;
  },
});

// Authenticated user rate limiter (higher limit for logged-in users)
// Apply this AFTER auth middleware for routes that require authentication
// - Development: 2000 requests/15 minutes
// - Production: 500 requests/15 minutes
const authenticatedLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 2000 : 500, // Higher limit for authenticated users
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Only apply to authenticated users
  skip: (req) => {
    // Skip if not authenticated (let apiLimiter handle it)
    const hasToken = hasAuthToken(req);
    const isAuthenticated = hasToken && req.user;
    if (!isAuthenticated && hasToken) {
      console.log('⚠️ Rate limiter: Request has token but req.user not set yet (auth middleware not run)');
    }
    return !hasToken || !req.user;
  },
});

// Strict rate limiter for authentication endpoints
// - Development: 20 requests/15 minutes
// - Production: 5 requests/15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 20 : 5, // Higher limit in development
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
  },
  skipSuccessfulRequests: true, // Don't count successful requests
});

// File upload rate limiter
// - Development: 50 uploads/hour
// - Production: 10 uploads/hour
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isDevelopment ? 50 : 10,
  message: {
    success: false,
    message: 'Too many file uploads, please try again later.',
  },
});

// Order creation rate limiter
// - Development: 100 orders/hour
// - Production: 20 orders/hour
const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isDevelopment ? 100 : 20,
  message: {
    success: false,
    message: 'Too many orders created, please try again later.',
  },
});

module.exports = {
  apiLimiter,
  authenticatedLimiter,
  authLimiter,
  uploadLimiter,
  orderLimiter,
};
