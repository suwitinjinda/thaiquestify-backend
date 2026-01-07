// server.js - FINAL VERSION WITH FACEBOOK OAUTH FIXES AND DEBUGGING

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios'); // ต้องเพิ่มเพื่อเรียก Facebook Graph API
// 1. ENVIRONMENT CONFIGURATION (MUST BE FIRST)
require('dotenv').config({ path: '.env' });

const questRoutes = require('./routes/quests');
const streakRoutes = require('./routes/streakRoutes');

const userGeneratedQuestsRoutes = require('./routes/userGeneratedQuests');

const app = express();

// --- Debug: Check if environment variables are loaded (Run on Startup) ---
console.log('🔧 Environment Check:');
console.log('   FACEBOOK_APP_ID:', process.env.FACEBOOK_APP_ID ? '✓ Loaded' : '✗ MISSING!');
console.log('   FACEBOOK_APP_SECRET:', process.env.FACEBOOK_CLIENT_SECRET ? '✓ Loaded' : '✗ MISSING!');
console.log('   JWT_SECRET:', process.env.JWT_SECRET ? '✓ Loaded' : '✗ MISSING!');
console.log('   NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('   PORT:', process.env.PORT || 5000);

// ===========================================
// 2. SYNCHRONOUS MIDDLEWARE SETUP
// ===========================================

// CORS (Simplest way to allow all origins)
app.use(cors());

// Body Parsers (CRITICAL for POST/PUT requests - MUST come before routes)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===========================================
// 3. DATABASE CONNECTION
// ===========================================

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thaiquestify';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));


// ===========================================
// 4. ROUTE IMPORTS AND USAGE (Keep your existing routes)
// ===========================================

const authRoutes = require('./routes/auth');
// ... (imports for other routes) ...
const debugRoutes = require('./routes/debug');
const integrationsRoutes = require('./routes/integrations');

// ********** ADD NEW STREAK ROUTES *********
app.use('/api/auth', authRoutes);
app.use('/api/integrations', integrationsRoutes);
app.use('/api/quests', questRoutes);
// ... (use for other routes) ...
app.use('/api/debug', debugRoutes);

app.use('/api', streakRoutes); // เพิ่มบรรทัดนี้

app.use('/api/user-generated-quests', userGeneratedQuestsRoutes);

// ===========================================
// 5. CRITICAL OAUTH CALLBACK ROUTE (FIXED)
// ===========================================

/**
 * Endpoint นี้จัดการ Callback จาก Facebook และ Google โดยใช้ HTTPS Redirect URI 
 * จากนั้น Backend จะต้องทำการ HTTP 302 Redirect กลับไปยัง Deep Link ของแอป
 * นี่คือขั้นตอนที่แก้ปัญหา "Dismiss" ใน Mobile App (Expo)
 */
app.get('/auth/callback', async (req, res) => {
  const { code, error, error_description, state } = req.query; // เพิ่ม state ในการรับค่า

  // --- DEBUG LOGS START ---
  console.log('\n======================================================');
  console.log('🔄 [AUTH CALLBACK] Request received.');
  console.log(`   Source IP: ${req.ip}`);
  console.log(`   Query Params keys: ${Object.keys(req.query)}`);
  // --- DEBUG LOGS END ---

  if (error) {
    console.error('❌ AUTH ERROR (Facebook/Google):', error, error_description);
    const errorUrl = `thaiquestify://auth?error=${encodeURIComponent(error)}&description=${encodeURIComponent(error_description || 'Authentication failed')}`;
    return res.redirect(302, errorUrl);
  }

  if (code) {
    // --- DEBUG LOGS START ---
    console.log(`✅ [STEP 1] Received Code: ${code.substring(0, 30)}...`);
    console.log('   [FIX] PKCE requires Client-side Token Exchange.');
    console.log('   [STEP 2] Performing FINAL HTTP 302 Redirect (Code back to App)...');
    // --- DEBUG LOGS END ---

    // 1. สร้าง Deep Link URL เพื่อส่ง code และ state กลับไป
    // สำคัญ: ต้องส่ง state คืนไปด้วยเพื่อให้ expo-auth-session ทำงานได้
    const deepLinkUrl = `thaiquestify://auth?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;

    console.log('   Redirect URL:', deepLinkUrl);
    console.log('======================================================\n');

    // 2. สั่ง HTTP 302 Redirect กลับไปยัง Mobile App
    return res.redirect(302, deepLinkUrl);
  }

  // กรณีที่ไม่พบ Code และไม่มี Error
  console.log('⚠️ CALLBACK received, but neither Code nor Error found.');
  console.log('======================================================\n');
  return res.redirect(302, 'thaiquestify://auth?error=unknown_callback');
});

// ===== GOOGLE CALLBACK ONLY =====
// server.js

// ===== GOOGLE CALLBACK FIX: Use a robust HTML redirect page ====
app.get('/auth/google/callback', (req, res) => {
  const { code, error, state } = req.query;

  // Define your app's deep link URI
  // IMPORTANT: This must match the scheme defined in your app.json/app.config.js
  const deepLinkBase = 'thaiquestify://auth/google';

  let deepLinkUrl;

  if (error) {
    deepLinkUrl = `${deepLinkBase}?error=${encodeURIComponent(error)}`;
  } else if (code) {
    // Send the code and state back to the mobile app for token exchange
    deepLinkUrl = `${deepLinkBase}?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
  } else {
    deepLinkUrl = `${deepLinkBase}?error=unknown_response`;
  }

  // 🔥 CRITICAL FIX: Serve an HTML page with a meta refresh and JavaScript redirect.
  // This is the most reliable way to jump from a web browser back to a mobile app.
  const htmlResponse = `
        <!DOCTYPE html>
        <html>
            <head>
                <title>Redirecting to App</title>
                <meta http-equiv="refresh" content="0; url=${deepLinkUrl}">
                <style>
                    body { font-family: sans-serif; text-align: center; padding: 50px; }
                    h1 { color: #4a6baf; }
                </style>
            </head>
            <body>
                <h1>Login Successful!</h1>
                <p>Redirecting you back to the ThaiQuestify app...</p>
                
                <a href="${deepLinkUrl}">Click here if you are not redirected automatically.</a>
                
                <script>
                    // JavaScript Fallback: Ensures the link is opened
                    window.location.replace("${deepLinkUrl}");
                </script>
            </body>
        </html>
    `;

  // Set content type to HTML and send the response
  res.set('Content-Type', 'text/html');
  return res.send(htmlResponse);
});

// ===== TIKTOK CALLBACK (CONNECT FOR QUESTS) =====
app.get('/auth/tiktok/callback', async (req, res) => {
  const { code, error, error_description, state } = req.query;

  const deepLinkBase = 'thaiquestify://integrations/tiktok';

  if (error) {
    const deepLinkUrl =
      `${deepLinkBase}?success=0&error=${encodeURIComponent(error)}` +
      `&description=${encodeURIComponent(error_description || 'TikTok authentication failed')}`;
    return res.redirect(302, deepLinkUrl);
  }

  if (!code || !state) {
    return res.redirect(302, `${deepLinkBase}?success=0&error=missing_code_or_state`);
  }

  // Verify signed state to get userId
  let decoded;
  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key-for-development';
    decoded = require('jsonwebtoken').verify(state, JWT_SECRET);

    if (!decoded || decoded.purpose !== 'tiktok_connect' || !decoded.userId) {
      return res.redirect(302, `${deepLinkBase}?success=0&error=invalid_state`);
    }
  } catch (e) {
    return res.redirect(302, `${deepLinkBase}?success=0&error=invalid_state`);
  }

  const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY;
  const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;
  const TIKTOK_REDIRECT_URI =
    process.env.TIKTOK_REDIRECT_URI || 'https://thaiquestify.com/auth/tiktok/callback';

  if (!TIKTOK_CLIENT_KEY || !TIKTOK_CLIENT_SECRET) {
    return res.redirect(302, `${deepLinkBase}?success=0&error=missing_tiktok_credentials`);
  }

  try {
    // Exchange code -> tokens (TikTok OAuth v2)
    const tokenParams = new URLSearchParams({
      client_key: TIKTOK_CLIENT_KEY,
      client_secret: TIKTOK_CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: TIKTOK_REDIRECT_URI,
    }).toString();

    const tokenResp = await axios.post(
      'https://open.tiktokapis.com/v2/oauth/token/',
      tokenParams,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const tokenData = tokenResp.data || {};
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const expiresIn = tokenData.expires_in;
    const openId = tokenData.open_id;
    const scope = tokenData.scope;

    // Fetch basic user info
    let displayName = null;
    let avatarUrl = null;
    let unionId = null;

    try {
      const infoResp = await axios.get(
        'https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,display_name,avatar_url',
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      const u = infoResp.data?.data?.user || {};
      displayName = u.display_name || null;
      avatarUrl = u.avatar_url || null;
      unionId = u.union_id || null;
    } catch (e) {
      console.log('⚠️ TikTok user info fetch failed:', e?.message || e);
    }

    const User = require('./models/User');
    const user = await User.findById(decoded.userId);

    if (user) {
      user.integrations = user.integrations || {};
      user.integrations.tiktok = {
        connectedAt: new Date(),
        openId: openId || null,
        unionId: unionId || null,
        displayName: displayName || null,
        avatarUrl: avatarUrl || null,
        accessToken: accessToken || null,
        refreshToken: refreshToken || null,
        expiresAt: expiresIn ? new Date(Date.now() + Number(expiresIn) * 1000) : null,
        scope: scope || null,
      };
      await user.save();
    }

    const deepLinkUrl = `${deepLinkBase}?success=1`;

    // Serve HTML redirect (most reliable on mobile)
    const htmlResponse = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Redirecting to App</title>
          <meta http-equiv="refresh" content="0; url=${deepLinkUrl}">
          <style>body{font-family:sans-serif;text-align:center;padding:50px}</style>
        </head>
        <body>
          <h1>TikTok Connected!</h1>
          <p>Redirecting you back to the ThaiQuestify app...</p>
          <a href="${deepLinkUrl}">Click here if you are not redirected automatically.</a>
          <script>window.location.replace("${deepLinkUrl}");</script>
        </body>
      </html>
    `;

    res.set('Content-Type', 'text/html');
    return res.send(htmlResponse);
  } catch (e) {
    console.error('❌ TikTok callback error:', e?.response?.data || e?.message || e);
    return res.redirect(302, `${deepLinkBase}?success=0&error=token_exchange_failed`);
  }
});

// ===========================================
// 6. APPLICATION ROUTES (Health Check, Root, Debug)
// ===========================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Thaiquestify API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Thaiquestify API',
    version: '1.0.0',
  });
});


// ===========================================
// 7. ERROR HANDLING AND 404 (MUST BE LAST)
// ===========================================

app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err.message
  });
});


// ===========================================
// 8. START SERVER
// ===========================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});