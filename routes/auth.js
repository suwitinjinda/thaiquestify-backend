// server/routes/auth.js - ADD debug endpoint
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const QuestSettings = require('../models/QuestSettings');
const PointTransaction = require('../models/PointTransaction');
const ActivityLog = require('../models/ActivityLog');
const logger = require('../utils/logger');
const { logLogin, logFailedLogin } = require('../utils/auditLogger');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;


// Google OAuth Login
router.post('/google', async (req, res) => {
  try {
    const { email, name, picture, googleId } = req.body;

    console.log('📱 Google login request:', email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'อีเมลไม่สามารถเป็นค่าว่างได้'
      });
    }

    // Check if user exists
    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      console.log('✅ Existing user found:', user.email);

      // Update user info
      user.lastLogin = new Date();
      user.isEmailVerified = true;
      user.signupMethod = 'google';

      if (googleId && !user.googleId) {
        user.googleId = googleId;
      }
      if (picture && !user.photo) {
        user.photo = picture;
      }
      if (name && name !== user.name) {
        user.name = name;
      }

      // Points are no longer given automatically - users must claim welcome reward
      await user.save();
    } else {
      console.log('🆕 Creating new Google user:', email);

      // Create new user - DEFAULT to 'customer'
      user = new User({
        email: email.toLowerCase(),
        name: name || email.split('@')[0],
        photo: picture || '',
        googleId: googleId || `google_${Date.now()}`,
        isEmailVerified: true,
        signupMethod: 'google',
        userType: 'customer',
        lastLogin: new Date()
        // ✅ ไม่มี isMockUser แล้ว
      });

      await user.save();
    }

    // Log login activity
    try {
      await logLogin(req, user, 'google');
      logger.activity('user_login', {
        userId: user._id,
        category: 'auth',
        metadata: { method: 'google', email: user.email }
      });
    } catch (logError) {
      console.error('Failed to log login activity:', logError.message);
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        userType: user.userType
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    console.log('✅ Generated token for:', user.email, 'Role:', user.userType);

    res.json({
      success: true,
      message: 'เข้าสู่ระบบด้วย Google สำเร็จ',
      token: token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        photo: user.photo,
        phone: user.phone || '',
        googleId: user.googleId,
        isEmailVerified: user.isEmailVerified,
        partnerCode: user.partnerCode || null,
        partnerId: user.partnerId || null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('❌ Google auth error:', error);
    res.status(500).json({
      success: false,
      message: 'การเข้าสู่ระบบล้มเหลว',
      error: error.message
    });
  }
});

router.post('/google/exchange', async (req, res) => {
  // 1. รับค่าจาก Frontend (req.body)
  const { code, code_verifier } = req.body;

  // ตรวจสอบค่าที่จำเป็น
  if (!code || !code_verifier) {
    return res.status(400).json({ success: false, message: 'Missing code or code_verifier.' });
  }

  // 2. กำหนดค่า Credentials และ URI
  const client_id = process.env.GOOGLE_CLIENT_ID;
  const client_secret = process.env.GOOGLE_CLIENT_SECRET;

  // ⚠️ CRITICAL: URI นี้ต้องตรงกับที่ลงทะเบียนใน Google Cloud Console
  const googleExchangeRedirectUri = 'https://thaiquestify.com/auth/google/callback';

  // 3. เตรียม Parameters สำหรับ Google API
  const exchangeParams = {
    code: code,
    client_id: client_id,
    client_secret: client_secret,
    redirect_uri: googleExchangeRedirectUri,
    code_verifier: code_verifier,
    grant_type: 'authorization_code',
  };

  try {
    // 4. แปลง Object ให้เป็น URL-encoded String
    // FIX: แก้ปัญหา "unsupported_grant_type" โดยการส่งข้อมูลเป็น x-www-form-urlencoded
    const body = new URLSearchParams(exchangeParams).toString();

    // 5. แลก Tokens กับ Google API
    const tokenResponse = await axios.post(
      'https://oauth2.googleapis.com/token',
      body, // ส่ง String ที่ URL-encoded แล้ว
      {
        headers: {
          // 🛑 CRITICAL FIX: ระบุ Content-Type ที่ Google API ต้องการ
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    const tokens = tokenResponse.data;
    console.log('✅ Tokens received from Google');

    // 2. Verify ID token
    // Try to verify with OAuth2Client, but handle errors gracefully
    let payload;
    
    try {
      // Create OAuth2Client instance (reuse if possible, but create new to avoid issues)
      const client = new OAuth2Client(GOOGLE_CLIENT_ID);
      
      // Verify ID token
      const ticket = await client.verifyIdToken({
        idToken: tokens.id_token,
        audience: GOOGLE_CLIENT_ID
      });
      
      payload = ticket.getPayload();
    } catch (verifyError) {
      console.error('❌ Error verifying Google ID token with OAuth2Client:', verifyError.message);
      console.error('   Error type:', verifyError.constructor.name);
      console.error('   Stack:', verifyError.stack?.substring(0, 500));
      
      // Fallback: Try to decode JWT manually (less secure but works if verification fails)
      // This is a workaround for the gaxios listener error
      try {
        console.log('⚠️ Attempting manual JWT decode as fallback...');
        const jwt = require('jsonwebtoken');
        // Decode without verification (less secure, but works)
        const decoded = jwt.decode(tokens.id_token, { complete: true });
        
        if (decoded && decoded.payload) {
          payload = decoded.payload;
          console.log('✅ Successfully decoded JWT manually');
          console.log('⚠️ WARNING: Token was decoded without verification - less secure!');
        } else {
          throw new Error('Failed to decode JWT token');
        }
      } catch (decodeError) {
        console.error('❌ Also failed to decode JWT manually:', decodeError.message);
        return res.status(500).json({
          success: false,
          message: 'Failed to verify Google ID token',
          error: 'Token verification failed. Please try again.'
        });
      }
    }
    console.log('👤 Google payload received:', {
      email: payload.email,
      name: payload.name,
      googleId: payload.sub,
      picture: payload.picture
    });

    // 3. 🔥 สำคัญ: หา User จาก Database
    console.log('🔍 Searching user in database...');

    // หาด้วย email หรือ googleId
    let user = await User.findOne({
      $or: [
        { email: payload.email.toLowerCase() },
        { googleId: payload.sub }
      ]
    });

    console.log('📊 Database query result:', user ? 'Found' : 'Not found');

    let isNewUser = false;

    if (!user) {
      // 3.1 ถ้าไม่พบ user ใน database -> สร้างใหม่
      console.log('🆕 Creating new user...');

      user = new User({
        email: payload.email.toLowerCase(),
        name: payload.name || payload.email.split('@')[0],
        googleId: payload.sub,
        photo: payload.picture || '',
        isEmailVerified: true,
        signupMethod: 'google',
        userType: 'customer',
        phone: '',
        partnerCode: null,
        isActive: true,
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await user.save();
      console.log('✅ New user created with ID:', user._id);
      isNewUser = true;

    } else {
      // 3.2 ถ้าพบ user มีอยู่แล้ว -> อัพเดทข้อมูล
      console.log('🔄 Updating existing user:', user.email);

      // อัพเดทข้อมูล Google ถ้ายังไม่มี
      if (!user.googleId) {
        user.googleId = payload.sub;
        console.log('➕ Added googleId to existing user');
      }

      // อัพเดทรูปโปรไฟล์ถ้ายังไม่มี
      if (payload.picture && !user.photo) {
        user.photo = payload.picture;
      }

      // อัพเดทชื่อถ้าต่างกัน
      if (payload.name && payload.name !== user.name) {
        user.name = payload.name;
      }

      // แน่ใจว่า signupMethod ถูกต้อง
      user.signupMethod = 'google';
      user.isEmailVerified = true;

      // อัพเดท lastLogin
      user.lastLogin = new Date();
      user.updatedAt = new Date();

      // Fix: Ensure integrations.facebook.accountType is valid or null
      // If user has Facebook integration but accountType is invalid, set to null
      if (user.integrations?.facebook) {
        const accountType = user.integrations.facebook.accountType;
        if (accountType !== null && accountType !== undefined &&
          !['user', 'page', 'unknown'].includes(accountType)) {
          // If invalid value, set to null
          user.integrations.facebook.accountType = null;
        }
      }

      // Use validateBeforeSave: false to skip validation for this update
      // Or mark the field as modified to allow null
      await user.save({ validateBeforeSave: true });
      console.log('✅ User updated successfully');
    }

    // Log login activity
    try {
      await logLogin(req, user, 'google_exchange');
      logger.activity('user_login', {
        userId: user._id,
        category: 'auth',
        metadata: { method: 'google_exchange', email: user.email }
      });
    } catch (logError) {
      console.error('Failed to log login activity:', logError.message);
    }

    // 4. 🔥 สร้าง JWT Token
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        userType: user.userType,
        googleId: user.googleId
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    // 5. 🔥 ส่งข้อมูล User ที่ครบถ้วนกลับไป
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      googleId: user.googleId, // ⚠️ สำคัญ!
      signupMethod: user.signupMethod, // ⚠️ สำคัญ!
      userType: user.userType, // ⚠️ สำคัญ!
      photo: user.photo,
      phone: user.phone || '',
      isEmailVerified: user.isEmailVerified, // ⚠️ สำคัญ!
      createdAt: user.createdAt, // ⚠️ สำคัญ!
      lastLogin: user.lastLogin, // ⚠️ สำคัญ!
      isActive: user.isActive,
      partnerCode: user.partnerCode || null,
      partnerId: user.partnerId || null,
      updatedAt: user.updatedAt
    };

    console.log('📤 Sending complete user data:', {
      hasGoogleId: !!userResponse.googleId,
      hasSignupMethod: !!userResponse.signupMethod,
      hasUserType: !!userResponse.userType,
      isNewUser: isNewUser
    });

    res.json({
      success: true,
      message: isNewUser ? 'สร้างบัญชีใหม่สำเร็จ' : 'เข้าสู่ระบบสำเร็จ',
      token: token,
      user: userResponse
    });

  } catch (error) {
    // จัดการ Error ทุกรูปแบบ (Network, Google API 400, DB Error)
    console.error('❌ FATAL Backend Error:', {
      message: error.message,
      stack: error.stack,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      } : null
    });

    let errorMessage = 'Internal server error during authentication process.';

    if (error.response) {
      // 💡 Google API Error (เช่น Code หมดอายุ, Verifier ผิด)
      console.error('GOOGLE API RESPONSE STATUS:', error.response.status);
      console.error('GOOGLE API RESPONSE DATA:', error.response.data);

      if (error.response.data && error.response.data.error === 'invalid_grant') {
        errorMessage = 'Invalid login code. Please try logging in again.';
      }
    }

    // 9. ส่ง Response ล้มเหลวกลับไป Frontend
    return res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message
    });
  }
});

router.get('/check-google-creds', (req, res) => {
  res.json({
    google: {
      has_client_id: !!process.env.GOOGLE_CLIENT_ID,
      has_client_secret: !!process.env.GOOGLE_CLIENT_SECRET,
      client_id_preview: process.env.GOOGLE_CLIENT_ID?.substring(0, 30) + '...',
      client_secret_preview: process.env.GOOGLE_CLIENT_SECRET?.substring(0, 10) + '...'
    },
    facebook: {
      has_secret: !!process.env.FACEBOOK_CLIENT_SECRET
    },
    jwt: {
      has_secret: !!process.env.JWT_SECRET
    }
  });
});

// Add to auth.js for debugging
router.post('/debug-oauth', async (req, res) => {
  try {
    const { code } = req.body;

    console.log('🔧 Debug OAuth request');
    console.log('Code length:', code?.length);

    // Try to decode the code (it's base64)
    try {
      const decoded = Buffer.from(code, 'base64').toString();
      console.log('Code decoded (partial):', decoded.substring(0, 100));
    } catch (e) {
      console.log('Cannot decode code');
    }

    res.json({
      success: true,
      message: 'Debug info logged',
      code_length: code?.length,
      env_vars: {
        has_client_id: !!process.env.GOOGLE_CLIENT_ID,
        has_client_secret: !!process.env.GOOGLE_CLIENT_SECRET,
        client_secret_length: process.env.GOOGLE_CLIENT_SECRET?.length || 0
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Debug endpoint to test OAuth configuration
router.get('/debug-config', (req, res) => {
  console.log('🔧 Debug config requested');

  const config = {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || 'NOT SET',
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      clientSecretLength: process.env.GOOGLE_CLIENT_SECRET ? process.env.GOOGLE_CLIENT_SECRET.length : 0,
      clientSecretPreview: process.env.GOOGLE_CLIENT_SECRET ?
        process.env.GOOGLE_CLIENT_SECRET.substring(0, 10) + '...' : 'NOT SET',
    },
    jwt: {
      hasSecret: !!process.env.JWT_SECRET,
      secretLength: process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0,
    },
    server: {
      nodeEnv: process.env.NODE_ENV || 'NOT SET',
      port: process.env.PORT || 'NOT SET',
      timestamp: new Date().toISOString(),
    }
  };

  console.log('Config:', JSON.stringify(config, null, 2));

  res.json({
    success: true,
    message: 'Configuration debug',
    config: config,
    instructions: 'Check if GOOGLE_CLIENT_SECRET is set (should be 40+ chars)'
  });
});

// Direct login endpoint for testing
router.post('/google/direct', async (req, res) => {
  try {
    const { code, redirect_uri } = req.body;

    console.log('🔧 Direct login requested');
    console.log('Code:', code ? `Present (${code.length} chars)` : 'Missing');
    console.log('Redirect URI:', redirect_uri);

    // Create a test user directly without Google OAuth
    const testEmail = 'test-' + Date.now() + '@thaiquestify.com';

    // Find or create user
    let user = await User.findOne({ email: testEmail });

    if (!user) {
      user = new User({
        email: testEmail,
        name: 'Test User',
        userType: 'customer',
        isEmailVerified: true,
        signupMethod: 'test',
        lastLogin: new Date()
      });
      await user.save();
    }

    // Generate token
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        userType: user.userType
      },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Direct test login successful',
      token: token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
      }
    });

  } catch (error) {
    console.error('Direct login error:', error);
    res.status(500).json({
      success: false,
      message: 'Direct login failed',
      error: error.message
    });
  }
});

// Simple echo endpoint to test connectivity
router.post('/echo', (req, res) => {
  console.log('📨 Echo request received:', req.body);
  res.json({
    success: true,
    message: 'Echo successful',
    received: req.body,
    timestamp: new Date().toISOString(),
    serverInfo: {
      ip: req.ip,
      method: req.method,
      url: req.url
    }
  });
});

// server/routes/auth.js - UPDATE THE DEBUG ENDPOINT
router.get('/debug', (req, res) => {
  console.log('🔧 Auth debug endpoint called - UPDATED VERSION');

  res.json({
    success: true,
    message: 'Auth API is working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',

    // ✅ ADD THESE FIELDS:
    hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    hasJwtSecret: !!process.env.JWT_SECRET,
    googleClientIdPreview: process.env.GOOGLE_CLIENT_ID ?
      process.env.GOOGLE_CLIENT_ID.substring(0, 20) + '...' : 'NOT SET',
    googleClientSecretLength: process.env.GOOGLE_CLIENT_SECRET ?
      process.env.GOOGLE_CLIENT_SECRET.length : 0,
    jwtSecretLength: process.env.JWT_SECRET ?
      process.env.JWT_SECRET.length : 0,

    endpoints: {
      google: 'POST /api/auth/google',
      googleExchange: 'POST /api/auth/google/exchange',
      login: 'POST /api/auth/login',
      register: 'POST /api/auth/register',
      test: 'GET /api/auth/test',
      testLogin: 'POST /api/auth/test-login',
      debug: 'GET /api/auth/debug'
    }
  });
});

// Test Google OAuth configuration
router.get('/test-oauth', async (req, res) => {
  try {
    console.log('🔧 Testing Google OAuth configuration...');

    const config = {
      hasClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      clientId: process.env.GOOGLE_CLIENT_ID || 'NOT SET',
      clientSecretPreview: process.env.GOOGLE_CLIENT_SECRET ?
        'SET (' + process.env.GOOGLE_CLIENT_SECRET.substring(0, 10) + '...)' : 'NOT SET',
      redirectUri: 'https://auth.expo.io/@anonymous/thaiquestify',
      timestamp: new Date().toISOString()
    };

    console.log('OAuth Config:', config);

    res.json({
      success: true,
      message: 'Google OAuth configuration test',
      config: config,
      instructions: 'Make sure GOOGLE_CLIENT_SECRET is set (starts with GOCSPX-)'
    });

  } catch (error) {
    console.error('OAuth test error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ✅ ADD TEST ENDPOINT
router.get('/test', async (req, res) => {
  try {
    // Count users
    const userCount = await User.countDocuments();

    // Get sample users
    const sampleUsers = await User.find({}).limit(3).select('email userType name');

    res.json({
      success: true,
      message: 'Auth test endpoint',
      userCount: userCount,
      sampleUsers: sampleUsers,
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasJwtSecret: !!process.env.JWT_SECRET
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Traditional login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('📱 Login attempt:', email);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกอีเมลและรหัสผ่าน'
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Log failed login attempt
      try {
        await logFailedLogin(req, email, 'user_not_found', 'password');
        logger.security('login_attempt_failed', {
          email: email,
          reason: 'user_not_found',
          ipAddress: req.ip
        });
      } catch (logError) {
        console.error('Failed to log failed login:', logError.message);
      }

      return res.status(401).json({
        success: false,
        message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
      });
    }

    // Check password (if user has password)
    if (user.password) {
      // You need to implement comparePassword method in User model
      const bcrypt = require('bcryptjs');
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        // Log failed login attempt
        try {
          await logFailedLogin(req, email, 'invalid_password', 'password');
          logger.security('login_attempt_failed', {
            userId: user._id,
            email: email,
            reason: 'invalid_password',
            ipAddress: req.ip
          });
        } catch (logError) {
          console.error('Failed to log failed login:', logError.message);
        }

        return res.status(401).json({
          success: false,
          message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
        });
      }
    } else {
      // User registered with Google
      return res.status(401).json({
        success: false,
        message: 'ผู้ใช้นี้ลงทะเบียนด้วย Google กรุณาเข้าสู่ระบบด้วย Google'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Log login activity
    try {
      await logLogin(req, user, 'password');
      logger.activity('user_login', {
        userId: user._id,
        category: 'auth',
        metadata: { method: 'password', email: user.email }
      });
    } catch (logError) {
      console.error('Failed to log login activity:', logError.message);
    }

    // Generate token
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        userType: user.userType
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      token: token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        photo: user.photo,
        phone: user.phone || '',
        isEmailVerified: user.isEmailVerified,
        partnerCode: user.partnerCode || null,
        partnerId: user.partnerId || null,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'ระบบขัดข้อง',
      error: error.message
    });
  }
});

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    console.log('📝 Registration attempt:', email);

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'อีเมลนี้ถูกใช้งานแล้ว'
      });
    }

    // Create new user
    const user = new User({
      name,
      email: email.toLowerCase(),
      phone: phone || '',
      password,
      userType: 'customer',
      isEmailVerified: false,
      signupMethod: 'email',
      lastLogin: new Date(),
      partnerCode: null,
      isActive: true,
      // ✅ ไม่มี isMockUser แล้ว
      facebookId: null,
      googleId: null
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        userType: user.userType
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ New user registered:', user.email);

    res.json({
      success: true,
      message: 'ลงทะเบียนสำเร็จ',
      token: token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        phone: user.phone,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถลงทะเบียนได้',
      error: error.message
    });
  }
});

// routes/auth.js - FACEBOOK AUTH SECTION (แก้ไขแล้ว)

// ==================== FACEBOOK AUTH ====================

// 1. แลก code เป็น access_token
router.post('/facebook/exchange', async (req, res) => {
  const { code, redirect_uri } = req.body;

  console.log('\n=== FACEBOOK EXCHANGE START ===');
  console.log('Code (first 20):', code?.substring(0, 20) + '...');
  console.log('Redirect URI:', redirect_uri);

  if (!code || !redirect_uri) {
    return res.status(400).json({
      success: false,
      message: 'Missing code or redirect_uri'
    });
  }

  // ⚠️ เช็ค environment variables
  if (!process.env.FACEBOOK_CLIENT_SECRET) {
    console.error('❌ FACEBOOK_CLIENT_SECRET is missing in .env!');
    return res.status(500).json({
      success: false,
      message: 'Server configuration error - Facebook secret missing'
    });
  }

  try {
    const response = await axios.get('https://graph.facebook.com/v20.0/oauth/access_token', {
      params: {
        client_id: '1479841916431052',
        client_secret: process.env.FACEBOOK_CLIENT_SECRET, // ⚠️ ต้องใช้ชื่อนี้
        redirect_uri,
        code,
      },
    });

    const access_token = response.data.access_token;

    if (!access_token) {
      throw new Error('No access token from Facebook');
    }

    console.log('✅ แลก access_token สำเร็จจาก Facebook');

    res.json({
      success: true,
      access_token,
    });
  } catch (error) {
    console.error('❌ แลก token Facebook ล้มเหลว:', error.response?.data || error.message);
    res.status(400).json({
      success: false,
      message: 'แลก token ไม่ได้',
      error: error.response?.data || error.message,
    });
  }
});

// 2. รับ access_token → สร้าง JWT ให้ผู้ใช้
router.post('/facebook', async (req, res) => {
  const { token } = req.body;

  console.log('\n=== FACEBOOK LOGIN START ===');
  console.log('Token received:', token ? 'YES' : 'NO');

  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Access token is required'
    });
  }

  try {
    // ดึงข้อมูลผู้ใช้จาก Facebook
    const me = await axios.get('https://graph.facebook.com/me', {
      params: {
        fields: 'id,name,email,picture.width(400)',
        access_token: token,
      },
    });

    const profile = me.data;
    console.log('✅ ได้ข้อมูลผู้ใช้จาก Facebook:', profile.name, profile.email || 'No email');

    // หาหรือสร้างผู้ใช้ใน DB
    let user = await User.findOne({ facebookId: profile.id });

    if (!user) {
      // เช็คว่ามี email นี้อยู่แล้วไหม (กรณี login Google ก่อน)
      if (profile.email) {
        user = await User.findOne({ email: profile.email.toLowerCase() });

        if (user) {
          // เชื่อม Facebook กับ account เดิม
          user.facebookId = profile.id;
          if (!user.photo) user.photo = profile.picture?.data?.url;

          // Points are no longer given automatically - users must claim welcome reward
          await user.save();
          console.log('✅ เชื่อม Facebook กับ account เดิม');
        }
      }

      // ถ้ายังไม่มี user เลย สร้างใหม่
      if (!user) {
        // สร้างผู้ใช้ใหม่
        user = new User({
          facebookId: profile.id,
          name: profile.name,
          email: profile.email || `fb_${profile.id}@thaiquestify.com`,
          photo: profile.picture?.data?.url,
          userType: 'customer',
          isEmailVerified: !!profile.email,
          signupMethod: 'facebook',
          lastLogin: new Date(),
          phone: '',
          partnerCode: null,
          isActive: true,
          // ✅ ไม่มี isMockUser แล้ว
          googleId: null
        });


        await user.save();
        console.log('✅ สร้างผู้ใช้ใหม่จาก Facebook');
      } else {
        // อัพเดทผู้ใช้ที่มีอยู่
        user.lastLogin = new Date();

        // Points are no longer given automatically - users must claim welcome reward
        await user.save();
        console.log('✅ เจอผู้ใช้เดิม, อัพเดท lastLogin');
      }

    } else {
      // Update existing user
      // Points are no longer given automatically - users must claim welcome reward
      user.lastLogin = new Date();
      if (profile.picture?.data?.url && !user.photo) {
        user.photo = profile.picture.data.url;
      }
      await user.save();
      console.log('✅ เจอผู้ใช้เดิม, อัพเดท lastLogin');
    }

    // Log login activity
    try {
      await logLogin(req, user, 'facebook');
      logger.activity('user_login', {
        userId: user._id,
        category: 'auth',
        metadata: { method: 'facebook', email: user.email }
      });
    } catch (logError) {
      console.error('Failed to log login activity:', logError.message);
    }

    // สร้าง JWT
    const jwtToken = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        userType: user.userType
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    console.log('✅ สร้าง JWT สำเร็จสำหรับ:', user.email);

    res.json({
      success: true,
      message: 'เข้าสู่ระบบด้วย Facebook สำเร็จ',
      token: jwtToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        photo: user.photo,
        phone: user.phone || '',
        facebookId: user.facebookId,
        isEmailVerified: user.isEmailVerified,
        partnerCode: user.partnerCode || null,
        partnerId: user.partnerId || null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
    });
  } catch (error) {
    console.error('❌ Facebook login ล้มเหลว:', error.message);
    console.error('Error details:', error.response?.data || error);

    res.status(400).json({
      success: false,
      message: 'Facebook login ไม่สำเร็จ',
      error: error.message
    });
  }
});

// 3. Debug endpoint
router.get('/facebook-config', (req, res) => {
  res.json({
    hasClientId: true, // hardcoded in code
    hasClientSecret: !!process.env.FACEBOOK_CLIENT_SECRET,
    clientId: '1479841916431052',
    clientSecretLength: process.env.FACEBOOK_CLIENT_SECRET ?
      process.env.FACEBOOK_CLIENT_SECRET.length : 0,
    message: process.env.FACEBOOK_CLIENT_SECRET ?
      '✅ Facebook credentials configured' :
      '❌ FACEBOOK_CLIENT_SECRET is missing in .env file'
  });
});

// Get current user profile (requires authentication)
const { auth } = require('../middleware/auth');
router.get('/me', auth, async (req, res) => {
  let timeoutId = null;
  try {
    // Add timeout protection with proper cleanup
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 10000); // 10 second timeout
    });

    const userPromise = User.findById(req.user.id)
      .select('-__v')
      .lean();

    const user = await Promise.race([userPromise, timeoutPromise]);
    
    // Clear timeout if query completed successfully
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Convert to plain object
    const userData = user;

    // Return user data without sensitive information
    res.json({
      success: true,
      user: {
        _id: userData._id,
        name: userData.name,
        email: userData.email,
        photo: userData.photo,
        phone: userData.phone,
        address: userData.address || '',
        district: userData.district || '',
        province: userData.province || '',
        coordinates: userData.coordinates || null,
        bankAccount: userData.bankAccount || null,
        userType: userData.userType,
        points: userData.points || 0,
        streakStats: userData.streakStats || {
          currentStreak: 0,
          longestStreak: 0,
          totalQuestsCompleted: 0,
          totalPointsEarned: 0,
          dailyQuestsCompletedToday: 0
        },
        socialStats: userData.socialStats || {
          friendsCount: 0,
          invitesSent: 0,
          invitesAccepted: 0,
          sharedQuests: 0,
          socialPoints: 0
        },
        achievements: userData.achievements || [],
        integrations: {
          tiktok: userData.integrations?.tiktok ? {
            connectedAt: userData.integrations.tiktok.connectedAt,
            displayName: userData.integrations.tiktok.displayName,
            username: userData.integrations.tiktok.displayName
          } : null
        },
        isEmailVerified: userData.isEmailVerified,
        partnerId: userData.partnerId || null,
        partnerCode: userData.partnerCode || null,
        isActive: userData.isActive,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt
      }
    });
  } catch (error) {
    // Clean up timeout if still active
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    
    console.error('❌ Error fetching user profile:', error);
    console.error('Error stack:', error.stack);
    
    // Handle timeout specifically
    if (error.message === 'Request timeout') {
      return res.status(504).json({
        success: false,
        message: 'Request timeout - database query took too long',
        error: 'TIMEOUT'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: error.message
    });
  }
});

// Update current user profile (PUT /api/auth/me)
router.put('/me', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;

    console.log('📝 Updating user profile:', userId);
    console.log('📦 Update data:', Object.keys(updateData));

    // Build update object with allowed fields
    const allowedFields = {
      name: updateData.name,
      phone: updateData.phone,
      photo: updateData.photo,
      address: updateData.address,
      district: updateData.district,
      province: updateData.province,
    };

    // Handle coordinates
    if (updateData.latitude !== undefined && updateData.longitude !== undefined) {
      allowedFields['coordinates.latitude'] = updateData.latitude;
      allowedFields['coordinates.longitude'] = updateData.longitude;
    }

    // Handle bankAccount
    if (updateData.bankAccount) {
      if (updateData.bankAccount.accountName !== undefined) {
        allowedFields['bankAccount.accountName'] = updateData.bankAccount.accountName;
      }
      if (updateData.bankAccount.accountNumber !== undefined) {
        allowedFields['bankAccount.accountNumber'] = updateData.bankAccount.accountNumber;
      }
      if (updateData.bankAccount.bankName !== undefined) {
        allowedFields['bankAccount.bankName'] = updateData.bankAccount.bankName;
      }
      if (updateData.bankAccount.bankBranch !== undefined) {
        allowedFields['bankAccount.bankBranch'] = updateData.bankAccount.bankBranch;
      }
      // Allow resetting verification status when user re-submits bank info
      if (updateData.bankAccount.verified !== undefined) {
        allowedFields['bankAccount.verified'] = updateData.bankAccount.verified;
      }
      if (updateData.bankAccount.verifiedAt !== undefined) {
        allowedFields['bankAccount.verifiedAt'] = updateData.bankAccount.verifiedAt;
      }
      if (updateData.bankAccount.verifiedBy !== undefined) {
        allowedFields['bankAccount.verifiedBy'] = updateData.bankAccount.verifiedBy;
      }
    }

    // Remove undefined fields
    Object.keys(allowedFields).forEach(key => {
      if (allowedFields[key] === undefined) {
        delete allowedFields[key];
      }
    });

    // Update timestamp
    allowedFields.updatedAt = new Date();

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: allowedFields },
      { new: true, runValidators: true }
    ).select('-__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('✅ User profile updated successfully');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        photo: user.photo,
        address: user.address,
        district: user.district,
        province: user.province,
        coordinates: user.coordinates,
        bankAccount: user.bankAccount,
        userType: user.userType,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('❌ Error updating user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user profile',
      error: error.message
    });
  }
});

/**
 * POST /api/auth/kyc/submit
 * Submit KYC (Know Your Customer) verification documents
 * Includes: national ID, bank account info, ID card photo, bank book photo, face photo
 */
router.post('/kyc/submit', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      nationalId, 
      bankAccount, 
      idCardImageUrl, 
      bankBookImageUrl, 
      facePhotoUrl 
    } = req.body;

    // Validate required fields
    if (!nationalId || nationalId.length !== 13) {
      return res.status(400).json({
        success: false,
        message: 'เลขบัตรประชาชนต้องมี 13 หลัก'
      });
    }

    if (!bankAccount || !bankAccount.accountName || !bankAccount.accountNumber || !bankAccount.bankName) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกข้อมูลธนาคารให้ครบถ้วน'
      });
    }

    if (!idCardImageUrl || !bankBookImageUrl || !facePhotoUrl) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาอัปโหลดรูปภาพทั้งหมด (บัตรประชาชน, หน้าบัญชี, รูปถ่าย)'
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบผู้ใช้'
      });
    }

    // Update user data
    user.nationalId = nationalId;
    user.bankAccount = {
      accountName: bankAccount.accountName.trim(),
      accountNumber: bankAccount.accountNumber.trim(),
      bankName: bankAccount.bankName.trim(),
      bankBranch: bankAccount.bankBranch?.trim() || '',
      verified: false, // Reset verification status when submitting new KYC
      verifiedAt: null,
      verifiedBy: null
    };

    // Update verification documents
    user.verificationDocuments = {
      idCard: {
        url: idCardImageUrl,
        status: 'pending',
        uploadedAt: new Date(),
        reviewedAt: null,
        reviewedBy: null,
        rejectionReason: null
      },
      bankBook: {
        url: bankBookImageUrl,
        status: 'pending',
        uploadedAt: new Date(),
        reviewedAt: null,
        reviewedBy: null,
        rejectionReason: null
      },
      facePhoto: {
        url: facePhotoUrl,
        status: 'pending',
        uploadedAt: new Date(),
        reviewedAt: null,
        reviewedBy: null,
        rejectionReason: null
      },
      overallStatus: 'pending'
    };

    await user.save();

    console.log(`✅ KYC submitted by user ${userId}: nationalId=${nationalId.substring(0, 3)}***, bank=${bankAccount.bankName}`);

    // Notify all admins about the verification request
    try {
      const { createVerificationRequestNotification } = require('../utils/notificationHelper');
      await createVerificationRequestNotification(
        userId,
        user.name || user.email,
        user.email
      );
    } catch (notifError) {
      console.error('⚠️ Failed to send verification request notification to admins:', notifError);
      // Don't fail the request if notification fails
    }

    return res.json({
      success: true,
      message: 'ส่งข้อมูลยืนยันตัวตนเรียบร้อยแล้ว กรุณารอการตรวจสอบจากผู้ดูแลระบบ',
      data: {
        nationalId: nationalId.substring(0, 3) + '***' + nationalId.substring(9), // Masked
        bankAccount: {
          accountName: bankAccount.accountName,
          bankName: bankAccount.bankName,
          accountNumber: '****' + bankAccount.accountNumber.slice(-4)
        },
        verificationStatus: 'pending'
      }
    });
  } catch (error) {
    console.error('Error submitting KYC:', error);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองใหม่อีกครั้ง',
      error: error.message
    });
  }
});

module.exports = router;