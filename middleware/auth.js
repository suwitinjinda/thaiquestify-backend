// middleware/auth.js - UPDATED VERSION (Support custom token format)
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    console.log('🔐 Auth middleware - Authorization header:', authHeader);
    
    // ตรวจสอบรูปแบบ header
    if (!authHeader) {
      console.log('❌ No Authorization header');
      return res.status(401).json({ 
        success: false,
        message: 'No authorization header' 
      });
    }

    // แยก Bearer token
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      console.log('❌ Invalid Authorization header format');
      return res.status(401).json({ 
        success: false,
        message: 'Invalid authorization format. Use: Bearer <token>' 
      });
    }

    const token = parts[1];
    console.log('🔐 Token received:', token ? `"${token}" (length: ${token.length})` : 'Empty');

    if (!token || token === 'null' || token === 'undefined') {
      console.log('❌ No token provided');
      return res.status(401).json({ 
        success: false,
        message: 'No token provided' 
      });
    }

    // ✅ SUPPORT CUSTOM TOKEN FORMATS
    console.log('🔐 Token format analysis:', {
      startsWithUserToken: token.startsWith('user-token-'),
      startsWithAutoLogin: token.startsWith('auto-login-'),
      parts: token.split('-')
    });

    // ✅ FORMAT 1: "user-token-{userId}-{timestamp}"
    if (token.startsWith('user-token-')) {
      console.log('🔓 Processing user-token format');
      
      // Format: "user-token-{userId}-{timestamp}"
      const tokenParts = token.split('-');
      console.log('🔓 Token parts:', tokenParts);
      
      if (tokenParts.length >= 4) {
        const userId = tokenParts[2]; // user-token-[userId]-timestamp
        const timestamp = tokenParts[3];
        
        console.log('🔓 Extracted userId:', userId, 'timestamp:', timestamp);
        
        try {
          const user = await User.findById(userId).select('_id name email userType partnerCode isActive');
          
          if (!user) {
            console.log('❌ User not found for user-token');
            return res.status(401).json({ 
              success: false,
              message: 'User not found' 
            });
          }

          if (!user.isActive) {
            console.log('❌ User account is inactive');
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
            partnerCode: user.partnerCode
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
        console.log('❌ Invalid user-token format');
        return res.status(401).json({ 
          success: false,
          message: 'Invalid token format' 
        });
      }
    }

    // ✅ FORMAT 2: "auto-login-{userId}"
    if (token.startsWith('auto-login-')) {
      console.log('🔓 Processing auto-login format');
      
      // Format: "auto-login-{userId}"
      const userId = token.replace('auto-login-', '');
      
      try {
        const user = await User.findById(userId).select('_id name email userType partnerCode isActive');
        
        if (!user) {
          console.log('❌ User not found for auto-login');
          return res.status(401).json({ 
            success: false,
            message: 'User not found' 
          });
        }

        if (!user.isActive) {
          console.log('❌ User account is inactive');
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
          partnerCode: user.partnerCode
        };

        console.log(`✅ Auto-login successful for: ${user.email} (${user.userType})`);
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
      console.log('🔐 Attempting JWT verification...');
      
      const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key-for-development';
      const decoded = jwt.verify(token, JWT_SECRET);
      
      console.log('🔐 JWT decoded:', decoded);
      
      const user = await User.findById(decoded.id || decoded._id || decoded.userId).select('_id name email userType partnerCode isActive');
      
      if (!user) {
        console.log('❌ User not found in database for JWT token');
        return res.status(401).json({ 
          success: false,
          message: 'User not found' 
        });
      }

      if (!user.isActive) {
        console.log('❌ User account is inactive');
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
        partnerCode: user.partnerCode
      };

      console.log(`✅ JWT authentication successful for: ${user.email} (${user.userType})`);
      next();
      
    } catch (jwtError) {
      console.log('❌ JWT verification failed:', jwtError.message);
      
      // ถ้าไม่ใช่ JWT format ที่รู้จักเลย
      console.log('❌ Token is not in any supported format');
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

module.exports = { auth };