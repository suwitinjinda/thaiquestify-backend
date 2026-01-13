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

// Request logging middleware (for debugging OAuth callbacks)
app.use((req, res, next) => {
  // Log Facebook callback requests and ALL auth-related requests
  if (req.path.includes('facebook') || req.path.includes('auth') || req.path.includes('callback')) {
    console.log('');
    console.log('🔍 [REQUEST LOG] ============================================');
    console.log('   Method:', req.method);
    console.log('   Path:', req.path);
    console.log('   Full URL:', req.url);
    console.log('   Full Request URL:', req.protocol + '://' + req.get('host') + req.originalUrl);
    console.log('   Has Query:', Object.keys(req.query).length > 0);
    if (Object.keys(req.query).length > 0) {
      console.log('   Query:', JSON.stringify(req.query, null, 2));
    }
    console.log('   IP:', req.ip || req.connection.remoteAddress);
    console.log('   User-Agent:', req.headers['user-agent']?.substring(0, 100));
    console.log('   Referer:', req.headers['referer'] || 'none');
    console.log('   Origin:', req.headers['origin'] || 'none');
    console.log('🔍 [REQUEST LOG] ============================================');
    console.log('');
  }
  next();
});

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
const privacyRoutes = require('./routes/privacy');

// ********** ADD NEW STREAK ROUTES *********
app.use('/api/auth', authRoutes);
app.use('/api/integrations', integrationsRoutes);
app.use('/api/quests', questRoutes);
// ... (use for other routes) ...
app.use('/api/debug', debugRoutes);

app.use('/api', streakRoutes); // เพิ่มบรรทัดนี้

app.use('/api/user-generated-quests', userGeneratedQuestsRoutes);

// Social Quests Routes
const socialQuestsRoutes = require('./routes/socialQuests');
app.use('/api/social-quests', socialQuestsRoutes);

// Dashboard Routes
const dashboardRoutes = require('./routes/dashboard');
app.use('/api', dashboardRoutes);

// Admin Routes
const adminRoutes = require('./routes/admin');
app.use('/api/v2/admin', adminRoutes);

// Rewards Routes
const rewardsRoutes = require('./routes/rewards');
app.use('/api/v2/rewards', rewardsRoutes);

// Partner Routes
const partnersRoutes = require('./routes/partners');
app.use('/api/partners', partnersRoutes);

// Shop Request Routes
const shopRequestsRoutes = require('./routes/shopRequests');
app.use('/api/shop-requests', shopRequestsRoutes);

// Tourist Attractions Routes
const touristAttractionsRoutes = require('./routes/touristAttractions');
app.use('/api/tourist-attractions', touristAttractionsRoutes);

// Tourist Quests Routes (Auto-create quests for tourist attractions)
const touristQuestsRoutes = require('./routes/touristQuests');
app.use('/api/tourist-quests', touristQuestsRoutes);

// Trips Routes
const tripsRoutes = require('./routes/trips');
app.use('/api/trips', tripsRoutes);

// Privacy Policy and Data Deletion Routes (for Facebook App Review)
app.use('/', privacyRoutes); // Privacy policy and data deletion routes

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

// ===== FACEBOOK CALLBACK (CONNECT FOR QUESTS) =====
app.get('/auth/facebook/callback', async (req, res) => {
  console.log('');
  console.log('🔔 [DEBUG] ============================================');
  console.log('🔔 [DEBUG] ============================================');
  console.log('🔔 [DEBUG] ✅✅✅ FACEBOOK CALLBACK ROUTE CALLED ✅✅✅');
  console.log('🔔 [DEBUG] ============================================');
  console.log('🔔 [DEBUG] ============================================');
  console.log('   Method:', req.method);
  console.log('   Path:', req.path);
  console.log('   Full URL:', req.url);
  console.log('   Full Request URL:', req.protocol + '://' + req.get('host') + req.originalUrl);
  console.log('   Has Code:', !!req.query.code);
  console.log('   Code Length:', req.query.code?.length || 0);
  console.log('   Has State:', !!req.query.state);
  console.log('   State Length:', req.query.state?.length || 0);
  console.log('   Has Error:', !!req.query.error);
  console.log('   Error:', req.query.error);
  console.log('   Error Description:', req.query.error_description);
  console.log('   Query Params:', JSON.stringify(req.query, null, 2));
  console.log('   Headers:', {
    'user-agent': req.headers['user-agent']?.substring(0, 80),
    'referer': req.headers['referer'],
    'origin': req.headers['origin'],
  });
  console.log('🔔 [DEBUG] ============================================');
  console.log('🔔 [DEBUG] ============================================');
  console.log('');

  const { code, error, error_description, state } = req.query;
  const deepLinkBase = 'thaiquestify://integrations/facebook';

  if (error) {
    console.log('❌ [DEBUG] ============================================');
    console.log('❌ [DEBUG] Facebook Callback - Error from Facebook');
    console.log('❌ [DEBUG] ============================================');
    console.log('   Error:', error);
    console.log('   Error Description:', error_description);
    console.log('❌ [DEBUG] ============================================');

    let errorMessage = error_description || 'Facebook authentication failed';
    let errorCode = error;

    // Handle specific Facebook errors
    if (error === 'access_denied' || error_description?.includes('user denied')) {
      errorMessage = 'คุณไม่ได้อนุญาตให้เชื่อมต่อ Facebook';
      errorCode = 'user_denied';
    } else if (error_description?.includes('something went wrong') ||
      error_description?.toLowerCase().includes('sorry')) {
      errorMessage = 'Facebook มีปัญหา กรุณาลองใหม่ในภายหลัง\n\nอาจเกิดจาก:\n- กดเชื่อมต่อหลายครั้ง\n- Session หมดอายุ\n- Facebook มีปัญหาชั่วคราว';
      errorCode = 'facebook_error';
    }

    const deepLinkUrl =
      `${deepLinkBase}?success=0&error=${encodeURIComponent(errorCode)}` +
      `&description=${encodeURIComponent(errorMessage)}`;

    // Use HTML redirect for errors too (consistent with success)
    const htmlErrorResponse = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Facebook Connection Failed</title>
          <meta http-equiv="refresh" content="0; url=${deepLinkUrl}">
          <style>body{font-family:sans-serif;text-align:center;padding:50px;background-color:#f8d7da;color:#721c24}h1{color:#721c24}a{color:#0056b3;font-weight:bold}</style>
        </head>
        <body>
          <h1>❌ Facebook Connection Failed</h1>
          <p>${errorMessage}</p>
          <p>กำลังนำกลับสู่แอป...</p>
          <a href="${deepLinkUrl}">คลิกที่นี่หากไม่ถูกนำกลับโดยอัตโนมัติ</a>
          <script>
            window.location.replace("${deepLinkUrl}");
            setTimeout(function() {
              window.location.href = "${deepLinkUrl}";
            }, 500);
          </script>
        </body>
      </html>
    `;

    res.set('Content-Type', 'text/html; charset=UTF-8');
    return res.status(200).send(htmlErrorResponse);
  }

  if (!code || !state) {
    console.log('❌ [DEBUG] Facebook Callback - Missing code or state');
    return res.redirect(302, `${deepLinkBase}?success=0&error=missing_code_or_state`);
  }

  // Verify signed state to get userId
  let decoded;
  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key-for-development';
    console.log('🔐 [DEBUG] Verifying state JWT:', {
      stateLength: state?.length,
      hasJWTSecret: !!JWT_SECRET,
    });
    decoded = require("jsonwebtoken").verify(state, JWT_SECRET);

    console.log('✅ [DEBUG] State JWT decoded:', {
      hasDecoded: !!decoded,
      purpose: decoded?.purpose,
      userId: decoded?.userId,
    });

    if (!decoded || decoded.purpose !== 'facebook_connect' || !decoded.userId) {
      console.log('❌ [DEBUG] Invalid state JWT:', {
        hasDecoded: !!decoded,
        purpose: decoded?.purpose,
        expectedPurpose: 'facebook_connect',
        userId: decoded?.userId,
      });
      return res.redirect(302, `${deepLinkBase}?success=0&error=invalid_state`);
    }
  } catch (e) {
    console.error('❌ [DEBUG] State JWT verification failed:', {
      error: e.message,
      stack: e.stack,
    });
    return res.redirect(302, `${deepLinkBase}?success=0&error=invalid_state`);
  }

  const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
  const FACEBOOK_APP_SECRET = process.env.FACEBOOK_CLIENT_SECRET || process.env.FACEBOOK_APP_SECRET;
  const FACEBOOK_REDIRECT_URI = process.env.FACEBOOK_REDIRECT_URI || 'https://thaiquestify.com/auth/facebook/callback';

  if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
    console.log('❌ [DEBUG] Missing Facebook credentials');
    return res.redirect(302, `${deepLinkBase}?success=0&error=missing_facebook_credentials`);
  }

  try {
    console.log('🔄 [DEBUG] Starting Facebook token exchange:', {
      hasAppId: !!FACEBOOK_APP_ID,
      hasAppSecret: !!FACEBOOK_APP_SECRET,
      hasCode: !!code,
      codeLength: code?.length,
      redirectUri: FACEBOOK_REDIRECT_URI,
    });

    // Exchange code -> access token
    const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `client_id=${encodeURIComponent(FACEBOOK_APP_ID)}` +
      `&redirect_uri=${encodeURIComponent(FACEBOOK_REDIRECT_URI)}` +
      `&client_secret=${encodeURIComponent(FACEBOOK_APP_SECRET)}` +
      `&code=${encodeURIComponent(code)}`;

    let tokenResp;
    try {
      tokenResp = await axios.get(tokenUrl);
      console.log('✅ [DEBUG] Facebook Token Exchange Success:', {
        hasData: !!tokenResp.data,
        hasAccessToken: !!tokenResp.data?.access_token,
        responseStatus: tokenResp.status,
      });
    } catch (error) {
      console.error('❌ [DEBUG] Facebook Token Exchange Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        errorData: error.response?.data,
        message: error.message,
      });
      throw error;
    }

    const { access_token: accessToken, expires_in: expiresIn } = tokenResp.data || {};

    if (!accessToken) {
      console.error('❌ [DEBUG] No access token in response:', tokenResp.data);
      throw new Error('No access token received');
    }

    console.log('🔍 [DEBUG] Access token received, fetching user info...');

    // Fetch user info - include link field to get public profile URL
    const userInfoUrl = `https://graph.facebook.com/v18.0/me?fields=id,name,email,picture,link&access_token=${encodeURIComponent(accessToken)}`;
    let userInfoResp;
    try {
      userInfoResp = await axios.get(userInfoUrl);
      console.log('✅ [DEBUG] User info fetched:', {
        hasData: !!userInfoResp.data,
        userId: userInfoResp.data?.id,
        name: userInfoResp.data?.name,
        link: userInfoResp.data?.link,
      });
    } catch (error) {
      console.error('❌ [DEBUG] Error fetching user info:', {
        status: error.response?.status,
        errorData: error.response?.data,
        message: error.message,
      });
      throw error;
    }

    const userInfo = userInfoResp.data;

    // ✅ Removed account type check logic
    // Simply save Facebook data after fetching from /me endpoint
    // Note: If we need to support Pages in the future, we'll need a separate flow with Page access token

    console.log('🔍 [DEBUG] Facebook User Info:', {
      id: userInfo.id,
      name: userInfo.name,
      email: userInfo.email,
      link: userInfo.link,
      hasPicture: !!userInfo.picture,
      pictureUrl: userInfo.picture?.data?.url,
    });

    // Use link field (public profile URL) if available, otherwise fallback to profile.php?id format
    const profileUrl = userInfo.link || `https://www.facebook.com/profile.php?id=${userInfo.id}`;

    const User = require('./models/User');
    const user = await User.findById(decoded.userId);

    if (user) {
      console.log('💾 [DEBUG] Saving Facebook integration to database...');
      user.integrations = user.integrations || {};
      user.integrations.facebook = {
        connectedAt: new Date(),
        userId: userInfo.id,
        name: userInfo.name || null,
        email: userInfo.email || null,
        avatarUrl: userInfo.picture?.data?.url || null,
        profileUrl: profileUrl,
        accessToken: accessToken,
        expiresAt: expiresIn ? new Date(Date.now() + Number(expiresIn) * 1000) : null,
        scope: 'public_profile,email,user_posts', // Added user_posts for testing (requires App Review for production)
        accountType: null, // Not checking account type anymore - just save the data
      };
      await user.save();
      console.log('✅ [DEBUG] ============================================');
      console.log('✅ [DEBUG] Facebook integration saved successfully');
      console.log('✅ [DEBUG] ============================================');
      console.log('   User ID:', userInfo.id);
      console.log('   Name:', userInfo.name);
      console.log('   Profile URL:', user.integrations.facebook.profileUrl);
      console.log('✅ [DEBUG] ============================================');
    } else {
      console.error('❌ [DEBUG] User not found:', decoded.userId);
    }

    const deepLinkUrl = `${deepLinkBase}?success=1`;
    console.log('🔔 [DEBUG] ============================================');
    console.log('🔔 [DEBUG] Redirecting to deep link');
    console.log('🔔 [DEBUG] Deep Link URL:', deepLinkUrl);
    console.log('🔔 [DEBUG] ============================================');

    // Use a more aggressive redirect approach
    const htmlResponse = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Redirecting to App</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="refresh" content="0; url=${deepLinkUrl}">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              text-align: center;
              padding: 50px 20px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              min-height: 100vh;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
            }
            .container {
              background: white;
              color: #333;
              padding: 40px;
              border-radius: 20px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.2);
              max-width: 400px;
            }
            h1 {
              color: #155724;
              margin-bottom: 20px;
              font-size: 24px;
            }
            .success-icon {
              font-size: 64px;
              margin-bottom: 20px;
            }
            .btn {
              display: inline-block;
              background: #1877F2;
              color: white;
              padding: 15px 30px;
              border-radius: 8px;
              text-decoration: none;
              font-weight: bold;
              margin-top: 20px;
              cursor: pointer;
              border: none;
              font-size: 16px;
            }
            .btn:hover {
              background: #1565C0;
            }
            .loading {
              margin-top: 20px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success-icon">✅</div>
            <h1>Facebook เชื่อมต่อสำเร็จ!</h1>
            <p>กำลังนำกลับสู่แอป ThaiQuestify...</p>
            <div class="loading" id="status">กำลังโหลด...</div>
            <a href="${deepLinkUrl}" class="btn" id="manualLink" onclick="window.location.href='${deepLinkUrl}'; return false;">คลิกที่นี่หากไม่ถูกนำกลับโดยอัตโนมัติ</a>
          </div>
          <script>
            console.log('🔔 [DEBUG] HTML Redirect Page Loaded');
            console.log('🔔 [DEBUG] Deep Link URL:', '${deepLinkUrl}');
            
            const deepLink = '${deepLinkUrl}';
            let redirectAttempts = 0;
            const maxAttempts = 5;
            
            function attemptRedirect() {
              redirectAttempts++;
              console.log('🔔 [DEBUG] Redirect attempt #' + redirectAttempts);
              
              const statusEl = document.getElementById('status');
              if (statusEl) {
                statusEl.textContent = 'กำลัง redirect... (ครั้งที่ ' + redirectAttempts + ')';
              }
              
              // Try multiple methods
              try {
                // Method 1: window.location.href (most compatible)
                window.location.href = deepLink;
              } catch (e) {
                console.error('❌ Redirect error:', e);
                // Method 2: window.location.replace
                try {
                  window.location.replace(deepLink);
                } catch (e2) {
                  console.error('❌ Replace error:', e2);
                  // Method 3: window.open (fallback)
                  try {
                    window.open(deepLink, '_self');
                  } catch (e3) {
                    console.error('❌ Open error:', e3);
                  }
                }
              }
            }
            
            // Immediate redirect (multiple methods simultaneously)
            attemptRedirect();
            setTimeout(attemptRedirect, 50);
            setTimeout(attemptRedirect, 100);
            
            // Retry redirects every 200ms for faster response
            const retryInterval = setInterval(function() {
              if (redirectAttempts < maxAttempts) {
                attemptRedirect();
              } else {
                clearInterval(retryInterval);
                const statusEl = document.getElementById('status');
                if (statusEl) {
                  statusEl.textContent = 'กรุณาคลิกปุ่มด้านล่างเพื่อกลับไปที่แอป';
                  statusEl.style.color = '#ff6b6b';
                }
                console.warn('⚠️ Max redirect attempts reached');
              }
            }, 200); // Faster retry (200ms instead of 500ms)
            
            // Try on click anywhere on page (immediate)
            document.addEventListener('click', function(e) {
              e.preventDefault();
              attemptRedirect();
              // Also try window.open as fallback
              try {
                window.open(deepLink, '_self');
              } catch (e) {}
            }, { once: true });
            
            // Try on touch events (for mobile)
            document.addEventListener('touchstart', function() {
              attemptRedirect();
            }, { once: true });
            
            // Fallback: try after page is fully loaded
            if (document.readyState === 'complete') {
              setTimeout(attemptRedirect, 50);
            } else {
              window.addEventListener('load', function() {
                setTimeout(attemptRedirect, 50);
                setTimeout(attemptRedirect, 200);
              });
            }
            
            // Last resort: try after 1 second
            setTimeout(function() {
              if (!connectionDetected) {
                attemptRedirect();
              }
            }, 1000);
            
            // Make button more visible and clickable
            const manualBtn = document.getElementById('manualLink');
            if (manualBtn) {
              manualBtn.addEventListener('click', function(e) {
                e.preventDefault();
                attemptRedirect();
                // Force redirect via window.location
                window.location.href = deepLink;
              });
            }
          </script>
        </body>
      </html>
    `;

    res.set('Content-Type', 'text/html; charset=UTF-8');
    return res.status(200).send(htmlResponse);
  } catch (e) {
    console.error('❌ [DEBUG] Facebook callback error:', {
      error: e.message,
      responseStatus: e?.response?.status,
      responseData: e?.response?.data,
      stack: e.stack,
    });
    const errorCode = e?.response?.status === 401 ? 'invalid_credentials'
      : e?.response?.status === 400 ? 'invalid_code'
        : 'token_exchange_failed';
    return res.redirect(302, `${deepLinkBase}?success=0&error=${errorCode}`);
  }
});

// ===== TIKTOK CALLBACK (CONNECT FOR QUESTS) =====
app.get('/auth/tiktok/callback', async (req, res) => {
  console.log('🔔 [DEBUG] TikTok Callback Route Called:', {
    method: req.method,
    path: req.path,
    query: req.query,
    hasCode: !!req.query.code,
    hasState: !!req.query.state,
    hasError: !!req.query.error,
    error: req.query.error,
    errorDescription: req.query.error_description,
  });

  const { code, error, error_description, state } = req.query;

  const deepLinkBase = 'thaiquestify://integrations/tiktok';

  if (error) {
    console.log('❌ [DEBUG] TikTok Callback - Error from TikTok:', {
      error,
      errorDescription: error_description,
    });
    const deepLinkUrl =
      `${deepLinkBase}?success=0&error=${encodeURIComponent(error)}` +
      `&description=${encodeURIComponent(error_description || 'TikTok authentication failed')}`;
    return res.redirect(302, deepLinkUrl);
  }

  if (!code || !state) {
    console.log('❌ [DEBUG] TikTok Callback - Missing code or state:', {
      hasCode: !!code,
      hasState: !!state,
      codeLength: code?.length,
      stateLength: state?.length,
    });
    return res.redirect(302, `${deepLinkBase}?success=0&error=missing_code_or_state`);
  }

  console.log('✅ [DEBUG] TikTok Callback - Starting token exchange:', {
    codeLength: code?.length,
    stateLength: state?.length,
  });

  // Verify signed state to get userId
  let decoded;
  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key-for-development';
    console.log('🔐 [DEBUG] Verifying state JWT:', {
      stateLength: state?.length,
      hasJWTSecret: !!JWT_SECRET,
    });

    decoded = require('jsonwebtoken').verify(state, JWT_SECRET);

    console.log('✅ [DEBUG] State JWT decoded:', {
      hasDecoded: !!decoded,
      purpose: decoded?.purpose,
      userId: decoded?.userId,
    });

    if (!decoded || decoded.purpose !== 'tiktok_connect' || !decoded.userId) {
      console.log('❌ [DEBUG] Invalid state JWT:', {
        hasDecoded: !!decoded,
        purpose: decoded?.purpose,
        expectedPurpose: 'tiktok_connect',
        userId: decoded?.userId,
      });
      return res.redirect(302, `${deepLinkBase}?success=0&error=invalid_state`);
    }
  } catch (e) {
    console.error('❌ [DEBUG] State JWT verification failed:', {
      error: e.message,
      stack: e.stack,
    });
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

    console.log('🔄 [DEBUG] TikTok Token Exchange Request:', {
      hasClientKey: !!TIKTOK_CLIENT_KEY,
      hasClientSecret: !!TIKTOK_CLIENT_SECRET,
      hasCode: !!code,
      redirectUri: TIKTOK_REDIRECT_URI,
      codeLength: code?.length,
    });

    let tokenResp;
    try {
      tokenResp = await axios.post(
        'https://open.tiktokapis.com/v2/oauth/token/',
        tokenParams,
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 30000, // 30 second timeout
        }
      );

      console.log('✅ [DEBUG] TikTok Token Exchange Success:', {
        hasData: !!tokenResp.data,
        hasAccessToken: !!tokenResp.data?.access_token,
        hasOpenId: !!tokenResp.data?.open_id,
        responseStatus: tokenResp.status,
      });
    } catch (error) {
      console.error('❌ [DEBUG] TikTok Token Exchange Error Details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        errorCode: error.response?.data?.error,
        errorDescription: error.response?.data?.error_description,
        errorDetails: error.response?.data?.error_details,
        fullResponseData: JSON.stringify(error.response?.data, null, 2),
        requestData: {
          redirectUri: TIKTOK_REDIRECT_URI,
          codeLength: code?.length,
          hasClientKey: !!TIKTOK_CLIENT_KEY,
          hasClientSecret: !!TIKTOK_CLIENT_SECRET,
        },
        message: error.message,
        stack: error.stack,
      });
      throw error;
    }

    const tokenData = tokenResp.data || {};
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const expiresIn = tokenData.expires_in;
    const openId = tokenData.open_id;
    const scope = tokenData.scope;

    // 🐛 DEBUG: Log token response data
    console.log('🔍 [DEBUG] TikTok OAuth Callback - Token Data:', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      openId: openId,
      'openId type': typeof openId,
      'openId length': openId?.length,
      scope: scope,
      expiresIn: expiresIn,
      allTokenFields: Object.keys(tokenData),
      fullTokenData: JSON.stringify({
        ...tokenData,
        access_token: accessToken ? '[REDACTED]' : null,
        refresh_token: refreshToken ? '[REDACTED]' : null,
      }, null, 2),
    });

    // Validate required fields
    if (!accessToken || !openId) {
      console.error('❌ [DEBUG] Missing required token fields:', {
        hasAccessToken: !!accessToken,
        hasOpenId: !!openId,
        tokenDataKeys: Object.keys(tokenData),
        fullTokenResponse: JSON.stringify(tokenData, null, 2),
      });
      throw new Error('Token exchange returned incomplete data: missing access_token or open_id');
    }

    // Fetch basic user info
    let displayName = null;
    let avatarUrl = null;
    let unionId = null;
    let username = null; // Declare outside try block so it's accessible later
    let stats = null;

    try {
      const infoResp = await axios.get(
        'https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,display_name,avatar_url,username',
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      const u = infoResp.data?.data?.user || {};
      displayName = u.display_name || null;
      avatarUrl = u.avatar_url || null;
      unionId = u.union_id || null;
      username = u.username || null; // Get actual username (e.g., "noom2419")

      // If username not in API response, try to extract from profile URL or use displayName
      // Note: TikTok API may not always return username, so we may need to extract it differently

      // 🐛 DEBUG: Log user info from API
      console.log('🔍 [DEBUG] TikTok User Info API Response:', {
        openIdFromAPI: u.open_id,
        username: username,
        displayName: displayName,
        unionId: unionId,
        avatarUrl: avatarUrl,
        allUserFields: Object.keys(u),
        fullUserData: JSON.stringify(u, null, 2),
      });
    } catch (e) {
      console.log('⚠️ TikTok user info fetch failed:', e?.message || e);
    }

    // Fetch stats if scope includes user.info.stats
    const hasStatsScope = scope?.includes('user.info.stats');
    if (hasStatsScope) {
      try {
        const statsResp = await axios.get(
          'https://open.tiktokapis.com/v2/user/info/?fields=follower_count,following_count,likes_count,video_count',
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        const statsData = statsResp.data?.data?.user || {};
        stats = {
          followerCount: statsData.follower_count || 0,
          followingCount: statsData.following_count || 0,
          likesCount: statsData.likes_count || 0,
          videoCount: statsData.video_count || 0,
          updatedAt: new Date(),
        };
      } catch (e) {
        console.log('⚠️ TikTok stats fetch failed during connection:', e?.message || e);
      }
    }

    const User = require('./models/User');
    const user = await User.findById(decoded.userId);

    if (user) {
      user.integrations = user.integrations || {};
      const tiktokData = {
        connectedAt: new Date(),
        openId: openId || null,
        unionId: unionId || null,
        username: username || null, // Store actual username (e.g., "noom2419")
        displayName: displayName || null, // Display name (e.g., "noom")
        avatarUrl: avatarUrl || null,
        accessToken: accessToken || null,
        refreshToken: refreshToken || null,
        expiresAt: expiresIn ? new Date(Date.now() + Number(expiresIn) * 1000) : null,
        scope: scope || null,
        stats: stats || null,
        lastStatsUpdate: stats ? new Date() : null,
      };

      // 🐛 DEBUG: Log data being saved to database
      console.log('💾 [DEBUG] TikTok OAuth Callback - Saving to database:', {
        userId: user._id,
        tiktokData: JSON.stringify(tiktokData, null, 2),
        openId: tiktokData.openId,
        displayName: tiktokData.displayName,
        'openId type': typeof tiktokData.openId,
        'openId length': tiktokData.openId?.length,
      });

      user.integrations.tiktok = tiktokData;
      await user.save();

      // 🐛 DEBUG: Verify what was saved
      const savedUser = await User.findById(user._id).select('integrations.tiktok');
      console.log('✅ [DEBUG] TikTok OAuth Callback - Verified saved data:', {
        savedOpenId: savedUser?.integrations?.tiktok?.openId,
        savedDisplayName: savedUser?.integrations?.tiktok?.displayName,
        fullSavedTiktok: JSON.stringify(savedUser?.integrations?.tiktok, null, 2),
      });
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
    console.error('❌ [DEBUG] TikTok callback error:', {
      error: e?.message,
      responseStatus: e?.response?.status,
      responseData: e?.response?.data,
      stack: e?.stack,
    });
    const errorCode = e?.response?.status === 401 ? 'invalid_credentials'
      : e?.response?.status === 400 ? 'invalid_code'
        : 'token_exchange_failed';
    return res.redirect(302, `${deepLinkBase}?success=0&error=${errorCode}`);
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

// Test endpoint to verify Facebook callback route is accessible
app.get('/auth/facebook/test', (req, res) => {
  console.log('✅ [TEST] Facebook callback test endpoint called');
  res.json({
    success: true,
    message: 'Facebook callback route is accessible',
    redirectUri: process.env.FACEBOOK_REDIRECT_URI || 'https://thaiquestify.com/auth/facebook/callback',
    timestamp: new Date().toISOString()
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