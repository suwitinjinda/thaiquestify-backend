// server.js - FINAL VERSION WITH FACEBOOK OAUTH FIXES AND DEBUGGING

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios'); // ต้องเพิ่มเพื่อเรียก Facebook Graph API
// 1. ENVIRONMENT CONFIGURATION (MUST BE FIRST)
require('dotenv').config({ path: '.env' });

// Scalability & Performance Middleware
const compression = require('./middleware/compression');
const { apiLimiter, authenticatedLimiter, authLimiter, uploadLimiter, orderLimiter } = require('./middleware/rateLimiter');

const questRoutes = require('./routes/quests');
const streakRoutes = require('./routes/streakRoutes');

const userGeneratedQuestsRoutes = require('./routes/userGeneratedQuests');

const app = express();

// Trust proxy (Nginx sets X-Forwarded-For); required for express-rate-limit behind a proxy
app.set('trust proxy', 1);

// --- Startup: minimal env check (only in dev or DEBUG=1) ---
const DEBUG_STARTUP = process.env.DEBUG === '1' || process.env.NODE_ENV !== 'production';
if (DEBUG_STARTUP) {
  console.log('🔧 NODE_ENV:', process.env.NODE_ENV || 'development', '| PORT:', process.env.PORT || 5000);
  if (!process.env.JWT_SECRET) console.warn('⚠️ JWT_SECRET missing');
}

// ===========================================
// 2. SYNCHRONOUS MIDDLEWARE SETUP
// ===========================================

// CORS (Simplest way to allow all origins)
app.use(cors());

// Response Compression (reduce bandwidth usage by 60-80%)
app.use(compression);

// Rate Limiting (protect API from abuse)
// General API rate limiter: 100 requests per 15 minutes per IP (or 1000 in development)
// Note: Authenticated users (with token) skip this and use authenticatedLimiter instead
app.use('/api/', apiLimiter);
// Strict rate limiter for auth endpoints: 5 requests per 15 minutes (or 20 in development)
app.use('/api/auth', authLimiter);
// Rate limiter for order creation: 20 orders per hour (or 100 in development)
app.use('/api/orders', orderLimiter);
// Note: authenticatedLimiter should be applied to protected routes AFTER auth middleware
// Example: router.get('/protected', auth, authenticatedLimiter, handler)

// Auth debug: set DEBUG_AUTH=1 to enable verbose OAuth callback logs
const DEBUG_AUTH = process.env.DEBUG_AUTH === '1';

// Body Parsers (CRITICAL for POST/PUT requests - MUST come before routes)
// Increase limit to 10MB to handle base64 image uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads
app.use('/uploads', express.static('uploads'));

// Static file serving for public files (Privacy Policy, etc.)
app.use(express.static('public'));

// Logging Middleware (for audit logs)
const { requestLogger, errorLogger } = require('./middleware/loggingMiddleware');
app.use(requestLogger);

// ===========================================
// 3. DATABASE CONNECTION
// ===========================================

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thaiquestify';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000, // 10 seconds timeout for initial connection
  socketTimeoutMS: 45000, // 45 seconds timeout for queries
})
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    // Don't crash server - it will retry on next request
  });

// Handle MongoDB connection events
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
  // Don't crash - connection will retry
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected - will reconnect on next request');
});

mongoose.connection.on('reconnected', () => {
  if (DEBUG_STARTUP) console.log('✅ MongoDB reconnected');
});


// ===========================================
// 4. ROUTE IMPORTS AND USAGE (Keep your existing routes)
// ===========================================

const authRoutes = require('./routes/auth');
// ... (imports for other routes) ...
const debugRoutes = require('./routes/debug');
const integrationsRoutes = require('./routes/integrations');
const privacyRoutes = require('./routes/privacy');
const { auth } = require('./middleware/auth');

// ********** ADD NEW STREAK ROUTES *********
app.use('/api/auth', authRoutes);
app.use('/api/integrations', integrationsRoutes);
app.use('/api/quests', questRoutes);

// TikTok routes (mounted separately to support /api/tiktok/* paths)
const tiktokRouter = express.Router();
tiktokRouter.get('/challenges', auth, async (req, res) => {
  try {
    const { limit = 10, sort = 'trending', includeJoined = false } = req.query;

    // TODO: Implement actual TikTok challenges API integration
    // For now, return mock/placeholder data
    const challenges = [
      {
        _id: 'challenge1',
        title: 'TikTok Hashtag Challenge',
        description: 'สร้างวิดีโอด้วยแฮชแท็ก #ThaiQuestifyChallenge',
        hashtag: 'ThaiQuestifyChallenge',
        creator: {
          name: 'ทีมงานไทยเควส',
          avatarColor: '#EE1D52'
        },
        participants: 0,
        completed: 0,
        isJoined: includeJoined === 'true' ? false : undefined,
        points: 100,
        deadline: null
      }
    ];

    return res.json({
      success: true,
      data: {
        challenges: challenges.slice(0, parseInt(limit)),
        count: challenges.length
      }
    });
  } catch (error) {
    console.error('❌ TikTok challenges error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get TikTok challenges',
      error: error.message
    });
  }
});

tiktokRouter.post('/challenges/:challengeId/join', auth, async (req, res) => {
  try {
    const { challengeId } = req.params;

    // TODO: Implement actual TikTok challenge join logic
    // For now, return success response
    return res.json({
      success: true,
      message: 'Joined TikTok challenge successfully',
      data: {
        challengeId,
        joinedAt: new Date()
      }
    });
  } catch (error) {
    console.error('❌ TikTok challenge join error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to join TikTok challenge',
      error: error.message
    });
  }
});

app.use('/api/tiktok', tiktokRouter);
// ... (use for other routes) ...
app.use('/api/debug', debugRoutes);

app.use('/api', streakRoutes); // เพิ่มบรรทัดนี้

app.use('/api/user-generated-quests', userGeneratedQuestsRoutes);

// Social Quests Routes
const socialQuestsRoutes = require('./routes/socialQuests');
app.use('/api/social-quests', socialQuestsRoutes);

// Orders Routes
const ordersRoutes = require('./routes/orders');
app.use('/api/orders', ordersRoutes);

// Jobs Routes (ระบบจ้างงาน)
const jobsRoutes = require('./routes/jobs');
app.use('/api/jobs', jobsRoutes);

// Deliveries Routes (ระบบส่งอาหาร)
const deliveriesRoutes = require('./routes/deliveries');
app.use('/api/deliveries', deliveriesRoutes);

// Delivery Requests Routes (ระบบส่งอาหารให้ร้านค้า)
const deliveryRequestsRoutes = require('./routes/deliveryRequests');
app.use('/api/delivery-requests', deliveryRequestsRoutes);

// Dashboard Routes
const dashboardRoutes = require('./routes/dashboard');
app.use('/api', dashboardRoutes);

// Admin Routes
const adminRoutes = require('./routes/admin');
const adminAuth = require('./middleware/adminAuth').adminAuth;
app.use('/api/v2/admin', adminRoutes);

// Admin: แคมเปญส่งเสริมการขาย (Campaigns)
const adminCampaignsRoutes = require('./routes/adminCampaigns');
app.use('/api/v2/admin/campaigns', auth, adminAuth, adminCampaignsRoutes);

// Verification Documents Routes (User)
const userVerificationDocumentsRoutes = require('./routes/userVerificationDocuments');
app.use('/api/user/verification-documents', userVerificationDocumentsRoutes);

// Verification Documents Routes (Admin)
const adminVerificationDocumentsRoutes = require('./routes/adminVerificationDocuments');
app.use('/api/admin/verification-documents', adminVerificationDocumentsRoutes);

// Activity Logs Routes
const activityLogsRoutes = require('./routes/activityLogs');
app.use('/api/v2/activity-logs', activityLogsRoutes);

// Users Routes (must be defined before /api/v2/users)
const usersRoutes = require('./routes/users');
app.use('/api/users', usersRoutes);

// Users V2 Routes (for v2 API endpoints)
app.use('/api/v2/users', usersRoutes);

// Points Routes
const pointsRoutes = require('./routes/points');
app.use('/api/points', pointsRoutes);

// Webhook Routes (must be before body parser for raw body)
const webhookRoutes = require('./routes/webhooks');
app.use('/api/webhooks', webhookRoutes);

// Rewards Routes
const rewardsRoutes = require('./routes/rewards');
app.use('/api/v2/rewards', rewardsRoutes);

// Coupons Routes
const couponsRoutes = require('./routes/coupons');
app.use('/api/coupons', couponsRoutes);

// Wallet Routes
const walletRoutes = require('./routes/wallet');
app.use('/api/v2/wallet', walletRoutes);

// Notifications Routes
const notificationsRoutes = require('./routes/notifications');
app.use('/api/v2/notifications', notificationsRoutes);

// Partner Routes
const partnersRoutes = require('./routes/partners');
app.use('/api/partners', partnersRoutes);

// Rider Routes
const riderRoutes = require('./routes/riders');
app.use('/api/rider', riderRoutes);

// Shop Request Routes
const shopRequestsRoutes = require('./routes/shopRequests');
app.use('/api/shop-requests', shopRequestsRoutes);

// Campaigns (public: list by shop; auth: my participations, join)
const campaignsRoutes = require('./routes/campaigns');
app.use('/api/campaigns', campaignsRoutes);

// Image proxy (stream GCP shop images so they load when bucket is private)
const imageProxyRoutes = require('./routes/imageProxy');
app.use('/api/image-proxy', imageProxyRoutes);

// Shop Routes
const shopRoutes = require('./routes/shops');
app.use('/api/shop', shopRoutes);

// Shop Quests Routes
const shopQuestsRoutes = require('./routes/shopQuests');
app.use('/api/shop/quests', shopQuestsRoutes);

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
  const { code, error, error_description, state } = req.query;

  if (DEBUG_AUTH) {
    console.log('[AUTH] Callback received', { path: req.path, hasCode: !!code, hasError: !!error });
  }

  if (error) {
    console.error('❌ AUTH ERROR:', error, error_description);
    const errorUrl = `thaiquestify://auth?error=${encodeURIComponent(error)}&description=${encodeURIComponent(error_description || 'Authentication failed')}`;
    return res.redirect(302, errorUrl);
  }

  if (code) {
    const deepLinkUrl = `thaiquestify://auth?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
    if (DEBUG_AUTH) console.log('[AUTH] Redirecting to deep link');
    return res.redirect(302, deepLinkUrl);
  }

  if (DEBUG_AUTH) console.warn('[AUTH] Callback: no code or error');
  return res.redirect(302, 'thaiquestify://auth?error=unknown_callback');
});

// ===== GOOGLE CALLBACK ONLY =====
// server.js

// ===== GOOGLE CALLBACK FIX: Use a robust HTML redirect page ====
app.get('/auth/google/callback', (req, res) => {
  const { code, error, state } = req.query;

  // Admin web: state starts with admin_web -> exchange code on server and redirect with one-time exchange code (no client storage)
  if (state && String(state).startsWith('admin_web')) {
    const adminBase = 'https://thaiquestify.com/admin-web/login';
    if (error) {
      return res.redirect(302, `${adminBase}?error=${encodeURIComponent(error)}`);
    }
    if (code) {
      const { exchangeGoogleCodeForUser } = require('./routes/auth');
      const adminExchangeStore = require('./lib/adminGoogleExchangeStore');
      exchangeGoogleCodeForUser(code, null)
        .then(({ token, user }) => {
          if (user.userType !== 'admin') {
            return res.redirect(302, `${adminBase}?error=${encodeURIComponent('not_admin')}`);
          }
          const exchangeCode = adminExchangeStore.set({ token, user });
          return res.redirect(302, `${adminBase}?exchange=${encodeURIComponent(exchangeCode)}`);
        })
        .catch((err) => {
          console.error('Admin web Google exchange error:', err.message);
          return res.redirect(302, `${adminBase}?error=${encodeURIComponent(err.message || 'exchange_failed')}`);
        });
      return;
    }
    return res.redirect(302, `${adminBase}?error=unknown_response`);
  }

  // Define your app's deep link URI (mobile)
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
  if (DEBUG_AUTH) {
    console.log('[FB] Callback', { hasCode: !!req.query.code, hasError: !!req.query.error });
  }

  const { code, error, error_description, state } = req.query;
  const deepLinkBase = 'thaiquestify://integrations/facebook';

  if (error) {
    console.error('❌ [FB] Callback error:', error, error_description);

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
    if (DEBUG_AUTH) console.warn('[FB] Missing code or state');
    return res.redirect(302, `${deepLinkBase}?success=0&error=missing_code_or_state`);
  }

  // Verify signed state to get userId
  let decoded;
  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key-for-development';
    decoded = require("jsonwebtoken").verify(state, JWT_SECRET);

    if (!decoded || decoded.purpose !== 'facebook_connect' || !decoded.userId) {
      if (DEBUG_AUTH) console.warn('[FB] Invalid state JWT');
      return res.redirect(302, `${deepLinkBase}?success=0&error=invalid_state`);
    }
  } catch (e) {
    console.error('❌ [FB] State JWT verification failed:', e.message);
    return res.redirect(302, `${deepLinkBase}?success=0&error=invalid_state`);
  }

  const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
  const FACEBOOK_APP_SECRET = process.env.FACEBOOK_CLIENT_SECRET || process.env.FACEBOOK_APP_SECRET;
  const FACEBOOK_REDIRECT_URI = process.env.FACEBOOK_REDIRECT_URI || 'https://thaiquestify.com/auth/facebook/callback';

  if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
    console.error('❌ [FB] Missing Facebook credentials');
    return res.redirect(302, `${deepLinkBase}?success=0&error=missing_facebook_credentials`);
  }

  try {
    if (DEBUG_AUTH) console.log('[FB] Token exchange starting');

    // Exchange code -> access token
    const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `client_id=${encodeURIComponent(FACEBOOK_APP_ID)}` +
      `&redirect_uri=${encodeURIComponent(FACEBOOK_REDIRECT_URI)}` +
      `&client_secret=${encodeURIComponent(FACEBOOK_APP_SECRET)}` +
      `&code=${encodeURIComponent(code)}`;

    let tokenResp;
    try {
      tokenResp = await axios.get(tokenUrl);
    } catch (error) {
      console.error('❌ [FB] Token exchange failed:', error.response?.status, error.message);
      throw error;
    }

    const { access_token: accessToken, expires_in: expiresIn } = tokenResp.data || {};

    if (!accessToken) {
      console.error('❌ [FB] No access token in response');
      throw new Error('No access token received');
    }

    // Fetch user info - include link field to get public profile URL
    const userInfoUrl = `https://graph.facebook.com/v18.0/me?fields=id,name,email,picture,link&access_token=${encodeURIComponent(accessToken)}`;
    let userInfoResp;
    try {
      userInfoResp = await axios.get(userInfoUrl);
    } catch (error) {
      console.error('❌ [FB] Fetch user info failed:', error.response?.status, error.message);
      throw error;
    }

    const userInfo = userInfoResp.data;

    // Use link field (public profile URL) if available, otherwise fallback to profile.php?id format
    const profileUrl = userInfo.link || `https://www.facebook.com/profile.php?id=${userInfo.id}`;

    const User = require('./models/User');
    const user = await User.findById(decoded.userId);

    if (user) {
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
      if (DEBUG_AUTH) console.log('[FB] Integration saved for user', decoded.userId);
    } else {
      console.error('❌ [FB] User not found:', decoded.userId);
    }

    const deepLinkUrl = `${deepLinkBase}?success=1`;

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
            const deepLink = '${deepLinkUrl}';
            let redirectAttempts = 0;
            const maxAttempts = 5;
            
            function attemptRedirect() {
              redirectAttempts++;
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
    console.error('❌ [FB] Callback error:', {
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
  if (DEBUG_AUTH) {
    console.log('[TikTok] Callback', { hasCode: !!req.query.code, hasError: !!req.query.error });
  }

  const { code, error, error_description, state } = req.query;

  const deepLinkBase = 'thaiquestify://integrations/tiktok';

  if (error) {
    console.error('❌ [TikTok] Callback error:', error, error_description);
    const deepLinkUrl =
      `${deepLinkBase}?success=0&error=${encodeURIComponent(error)}` +
      `&description=${encodeURIComponent(error_description || 'TikTok authentication failed')}`;
    return res.redirect(302, deepLinkUrl);
  }

  if (!code || !state) {
    if (DEBUG_AUTH) console.warn('[TikTok] Missing code or state');
    return res.redirect(302, `${deepLinkBase}?success=0&error=missing_code_or_state`);
  }

  // Verify signed state to get userId
  let decoded;
  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key-for-development';
    decoded = require('jsonwebtoken').verify(state, JWT_SECRET);

    if (!decoded || decoded.purpose !== 'tiktok_connect' || !decoded.userId) {
      if (DEBUG_AUTH) console.warn('[TikTok] Invalid state JWT');
      return res.redirect(302, `${deepLinkBase}?success=0&error=invalid_state`);
    }
  } catch (e) {
    console.error('❌ [TikTok] State JWT verification failed:', e.message);
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

    if (DEBUG_AUTH) console.log('[TikTok] Token exchange starting');

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

    } catch (error) {
      console.error('❌ [TikTok] Token exchange failed:', error.response?.status, error.response?.data?.error, error.message);
      throw error;
    }

    const tokenData = tokenResp.data || {};
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const expiresIn = tokenData.expires_in;
    const openId = tokenData.open_id;
    const scope = tokenData.scope;

    // Validate required fields
    if (!accessToken || !openId) {
      console.error('❌ [TikTok] Missing access_token or open_id in token response');
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

    } catch (e) {
      if (DEBUG_AUTH) console.warn('[TikTok] User info fetch failed:', e?.message || e);
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
        if (DEBUG_AUTH) console.warn('[TikTok] Stats fetch failed:', e?.message || e);
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

      user.integrations.tiktok = tiktokData;
      await user.save();
      if (DEBUG_AUTH) console.log('[TikTok] Integration saved for user', decoded.userId);
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
    console.error('❌ [TikTok] Callback error:', {
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

// Favicon – return 204 to avoid 404 from browsers/crawlers
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Sitemap – API has no sitemap; return 204 to avoid 404 from crawlers
app.get('/sitemap.xml', (req, res) => {
  res.status(204).end();
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

// Error logging middleware (must be before error handler)
app.use(errorLogger);

// ===========================================
// 8. START SERVER
// ===========================================

// ===========================================
// 9. SCHEDULED TASKS (Cron Jobs)
// ===========================================

// Auto-cancel orders without rider after 1 day
const orderCancellationService = require('./services/orderCancellationService');

// Use croner for scheduled tasks
let Cron;
try {
  Cron = require('croner');
  if (DEBUG_STARTUP) console.log('✅ Croner loaded');
} catch (error) {
  if (DEBUG_STARTUP) console.warn('⚠️ Croner not available, using setInterval fallback');
  Cron = null;
}

// Run every day at 00:01 AM (1 minute after midnight)
// This will cancel orders created yesterday that have no rider
function setupOrderCancellationCron() {
  if (Cron) {
    // Use croner for precise scheduling
    const job = Cron('1 0 * * *', async () => {
      try {
        await orderCancellationService.cancelAgingOrders();
      } catch (error) {
        console.error('❌ Error in scheduled order cancellation:', error);
      }
    });
    if (DEBUG_STARTUP) console.log('⏰ Order cancellation: daily 00:01');
  } else {
    // Fallback to setInterval
    if (DEBUG_STARTUP) console.log('⏰ Order cancellation: setInterval fallback');

    // Calculate milliseconds until next midnight + 1 minute
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 1, 0, 0); // 00:01 AM

    // Run after calculated delay, then every 24 hours
    setTimeout(async () => {
      try {
        await orderCancellationService.cancelAgingOrders();
      } catch (error) {
        console.error('❌ Error in scheduled order cancellation:', error);
      }

      // Then schedule to run every 24 hours
      const orderCancellationInterval = setInterval(async () => {
        try {
          await orderCancellationService.cancelAgingOrders();
        } catch (error) {
          console.error('❌ Error in scheduled order cancellation:', error);
          // Don't let errors crash the interval - continue running
        }
      }, 24 * 60 * 60 * 1000); // Every 24 hours

      // Store interval reference for potential cleanup
      if (global.orderCancellationInterval) {
        clearInterval(global.orderCancellationInterval);
      }
      global.orderCancellationInterval = orderCancellationInterval;
    }, msUntilMidnight);
  }

  // Run immediately on startup (5s delay)
  setTimeout(async () => {
    try {
      await orderCancellationService.cancelAgingOrders();
    } catch (error) {
      console.error('❌ Error in initial order cancellation:', error);
    }
  }, 5000);
}

// Setup cron job
setupOrderCancellationCron();

// ===========================================
// 9.1. SETUP DELIVERY REQUEST TIMEOUT CHECK
// ===========================================
// Check every minute for delivery requests that have been pending for more than 10 minutes
// and cancel them automatically
function setupDeliveryRequestTimeoutCheck() {
  const deliveryAssignmentService = require('./services/deliveryAssignmentService');

  // Run immediately on startup (after 10 seconds to let server initialize)
  setTimeout(async () => {
    try {
      await deliveryAssignmentService.checkAndCancelOldPendingRequests();
    } catch (error) {
      console.error('❌ Error in initial delivery request timeout check:', error);
    }
  }, 10000); // Run 10 seconds after startup

  // Then run every minute
  const deliveryInterval = setInterval(async () => {
    try {
      await deliveryAssignmentService.checkAndCancelOldPendingRequests();
    } catch (error) {
      console.error('❌ Error in delivery request timeout check:', error);
      // Don't let errors crash the interval - continue running
    }
  }, 60 * 1000); // Every 1 minute

  // Store interval reference for potential cleanup
  if (global.deliveryInterval) {
    clearInterval(global.deliveryInterval);
  }
  global.deliveryInterval = deliveryInterval;

  if (DEBUG_STARTUP) console.log('⏰ Delivery timeout check: every 1 min');
}

// Setup delivery request timeout check
setupDeliveryRequestTimeoutCheck();

// ===========================================
// 9.2. SETUP CLEANUP FOR CANCELLED REQUESTS
// ===========================================
// Check for delivery requests that are cancelled/expired but order is not cancelled
// This ensures consistency - if request is cancelled/expired, order should be cancelled too
function setupCancelledRequestsCleanup() {
  const deliveryAssignmentService = require('./services/deliveryAssignmentService');

  // Run immediately on startup (after 15 seconds to let server initialize)
  setTimeout(async () => {
    try {
      await deliveryAssignmentService.checkAndCancelOrdersForCancelledRequests();
    } catch (error) {
      console.error('❌ Error in initial cancelled requests cleanup:', error);
    }
  }, 15000);

  // Then run every 5 minutes
  setInterval(async () => {
    try {
      await deliveryAssignmentService.checkAndCancelOrdersForCancelledRequests();
    } catch (error) {
      console.error('❌ Error in cancelled requests cleanup:', error);
    }
  }, 5 * 60 * 1000); // Every 5 minutes

  if (DEBUG_STARTUP) console.log('⏰ Cancelled requests cleanup: every 5 min');
}

// Setup cancelled requests cleanup
setupCancelledRequestsCleanup();

// ===========================================
// 9.3. ERROR HANDLING FOR INTERVALS
// ===========================================
// Prevent unhandled promise rejections from crashing the server
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise);
  console.error('❌ Reason:', reason);
  if (reason instanceof Error) {
    console.error('❌ Error stack:', reason.stack);
  }
  // Don't exit - just log the error to prevent server crashes
  // The error is logged but server continues running
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('❌ Error stack:', error.stack);
  // Don't exit - just log the error to prevent server crashes
  // In production, you might want to gracefully shutdown, but for now keep running
});

// ===========================================
// 10. START SERVER
// ===========================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
});