// middleware/auth.js - UPDATED VERSION (Support custom token format)
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const _debug = () => process.env.DEBUG_AUTH === '1';

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');

    // ตรวจสอบรูปแบบ header
    if (!authHeader) {
      if (_debug()) console.log('❌ No Authorization header');
      return res.status(401).json({
        success: false,
        message: 'No authorization header'
      });
    }

    // แยก Bearer token
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      if (_debug()) console.log('❌ Invalid Authorization header format');
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization format. Use: Bearer <token>'
      });
    }

    const token = parts[1];
    if (_debug()) console.log('🔐 Token received:', token ? `(length: ${token.length})` : 'Empty');

    if (!token || token === 'null' || token === 'undefined') {
      if (_debug()) console.log('❌ No token provided');
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // ✅ FORMAT 1: "user-token-{userId}-{timestamp}"
    if (token.startsWith('user-token-')) {
      const tokenParts = token.split('-');

      if (tokenParts.length >= 4) {
        const userId = tokenParts[2]; // user-token-[userId]-timestamp

        try {
          const user = await User.findById(userId).select('_id name email userType partnerCode partnerId isActive');

          if (!user) {
            if (_debug()) console.log('❌ User not found for user-token');
            return res.status(401).json({
              success: false,
              message: 'User not found'
            });
          }

          if (!user.isActive) {
            if (_debug()) console.log('❌ User account is inactive');
            return res.status(401).json({
              success: false,
              message: 'Account is inactive'
            });
          }

          req.user = {
            _id: user._id,
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            userType: user.userType,
            partnerCode: user.partnerCode,
            partnerId: user.partnerId
          };

          console.log(`✅ User-token authentication successful for: ${user.email} (${user.userType})`);
          return next();

        } catch (dbError) {
          console.error('❌ Database error during user-token auth:', dbError);
          return res.status(500).json({
            success: false,
            message: 'Database error during authentication'
          });
        }
      } else {
        if (_debug()) console.log('❌ Invalid user-token format');
        return res.status(401).json({
          success: false,
          message: 'Invalid token format'
        });
      }
    }

    // ✅ FORMAT 2: "auto-login-{userId}"
    if (token.startsWith('auto-login-')) {
      const userId = token.replace('auto-login-', '');

      try {
        const user = await User.findById(userId).select('_id name email userType partnerCode partnerId isActive');

        if (!user) {
          if (_debug()) console.log('❌ User not found for auto-login');
          return res.status(401).json({
            success: false,
            message: 'User not found'
          });
        }

        if (!user.isActive) {
          if (_debug()) console.log('❌ User account is inactive');
          return res.status(401).json({
            success: false,
            message: 'Account is inactive'
          });
        }

        req.user = {
          _id: user._id,
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          userType: user.userType,
          partnerCode: user.partnerCode,
          partnerId: user.partnerId
        };

        if (_debug()) console.log(`✅ Auto-login: ${user.email}`);
        return next();

      } catch (dbError) {
        console.error('❌ Database error during auto-login:', dbError);
        return res.status(500).json({
          success: false,
          message: 'Database error during authentication'
        });
      }
    }

    // ✅ FORMAT 3: REAL JWT TOKEN (สำหรับ production)
    try {
      const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key-for-development';
      const decoded = jwt.verify(token, JWT_SECRET);

      const user = await User.findById(decoded.id || decoded._id || decoded.userId).select('_id name email userType partnerCode partnerId isActive');

      if (!user) {
        if (_debug()) console.log('❌ User not found in database for JWT token');
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      if (!user.isActive) {
        if (_debug()) console.log('❌ User account is inactive');
        return res.status(401).json({
          success: false,
          message: 'Account is inactive'
        });
      }

      req.user = {
        _id: user._id,
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        userType: user.userType,
        partnerCode: user.partnerCode,
        partnerId: user.partnerId
      };

      next();

    } catch (jwtError) {
      if (_debug()) console.log('❌ JWT verification failed:', jwtError.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid token format. Supported formats: user-token-*, auto-login-*, or valid JWT',
        errorType: jwtError.name
      });
    }

  } catch (error) {
    console.error('❌ Auth middleware unexpected error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

// Admin authentication middleware
const adminAuth = async (req, res, next) => {
  try {
    // First check if user is authenticated
    await new Promise((resolve, reject) => {
      auth(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Then check if user is admin
    if (!req.user || req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
};

module.exports = { auth, adminAuth };