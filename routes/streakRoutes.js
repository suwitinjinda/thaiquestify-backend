const express = require('express');
const router = express.Router();
const DailyQuestService = require('../new-services/daily-quests/dailyQuestService'); // ตรวจสอบ path
const StreakService = require('../new-services/streak/streakService'); // ตรวจสอบ path

// วิธีตรวจสอบว่า auth เป็น object หรือ function
const authModule = require('../middleware/auth');
let auth;

if (typeof authModule === 'function') {
  auth = authModule;
} else if (authModule.auth && typeof authModule.auth === 'function') {
  auth = authModule.auth;
} else {
  console.warn('⚠️ Using mock auth middleware');
  auth = (req, res, next) => {
    console.log('🔓 Mock auth middleware');
    req.user = {
      id: 'mock-user-id-123',
      name: 'Mock User',
      email: 'mock@example.com',
      userType: 'customer'
    };
    next();
  };
}

// Streak stats
router.get('/v2/streak/stats', auth, async (req, res) => {
  try {
    console.log('📊 Streak stats for user:', req.user.id);

    const stats = await StreakService.getStreakStats(req.user.id);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting streak stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// เพิ่ม debug log ใน routes/streakRoutes.js
// router.get('/v2/daily-quests/today', auth, async (req, res) => {
//   try {
//     console.log('📋 [DEBUG] Starting daily quests for user:', req.user.id);
//     console.log('📋 [DEBUG] User ID:', req.user.id);
//     console.log('📋 [DEBUG] User email:', req.user.email);

//     // ตรวจสอบว่า service พร้อม
//     if (!DailyQuestService.getTodaysQuests) {
//       console.error('❌ [DEBUG] DailyQuestService.getTodaysQuests not found');
//       throw new Error('DailyQuestService.getTodaysQuests is not available');
//     }

//     console.log('📋 [DEBUG] Calling DailyQuestService.getTodaysQuests...');

//     // เรียกใช้ service จริง
//     const quests = await DailyQuestService.getTodaysQuests(req.user.id);

//     console.log('📋 [DEBUG] getTodaysQuests returned:', {
//       type: typeof quests,
//       isArray: Array.isArray(quests),
//       length: Array.isArray(quests) ? quests.length : 'N/A',
//       sample: quests && Array.isArray(quests) && quests.length > 0 ? quests[0] : 'No quests'
//     });

//     // ... rest of the code
//   } catch (error) {
//     console.error('❌ [DEBUG] Error getting daily quests:', error);
//     console.error('❌ [DEBUG] Error stack:', error.stack);
//     // ... error handling
//   }
// });

// ในไฟล์ backend routes (streakRoutes.js หรือ dailyQuestRoutes.js)
// ใน streakRoutes.js - ตรวจสอบว่าเรียกใช้ service จริง
router.get('/v2/daily-quests/today', auth, async (req, res) => {
  try {
    console.log('📋 Daily quests for user:', req.user.id);

    // ต้องใช้ service จริง ไม่ใช้ mock data
    const quests = await DailyQuestService.getTodaysQuests(req.user.id);

    const completedCount = quests.filter(q => q.isCompleted).length;

    console.log("quest: ", quests)
    console.log("completedCount: ", completedCount)

    res.json({
      success: true,
      data: quests,
      summary: {
        total: quests.length,
        completed: completedCount,
        available: quests.filter(q => q.isAvailable).length
      }
    });

  } catch (error) {
    console.error('❌ Error in daily quests endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Using fallback data'
    });
  }
});

// Complete quest - 🔧 FIXED VERSION (เรียกใช้ service จริง)
router.post('/v2/daily-quests/:questId/complete', auth, async (req, res) => {
  try {
    console.log('🎯 Complete quest:', req.params.questId, 'for user:', req.user.id);

    // เรียกใช้ service จริง
    const result = await DailyQuestService.completeQuest(
      req.user.id,
      req.params.questId
    );

    // 🔧 FIX: ดึง quests ใหม่เพื่อคำนวณ summary หลัง complete
    const updatedQuests = await DailyQuestService.getTodaysQuests(req.user.id);
    const completedCount = updatedQuests.filter(q => q.isCompleted).length;

    res.json({
      success: true,
      data: {
        ...result,
        questId: req.params.questId,
        // 🔧 FIX: บอกว่า quest นี้ complete แล้ว
        isCompleted: true,
        // 🔧 FIX: ส่ง summary ใหม่กลับไป
        summary: {
          total: updatedQuests.length,
          completed: completedCount,
          available: updatedQuests.filter(q => q.isAvailable).length
        }
      }
    });
  } catch (error) {
    console.error('Error completing quest:', error);

    let statusCode = 400;
    let errorMessage = error.message;

    // กำหนด status code ตาม error type
    if (error.message.includes('already completed')) {
      statusCode = 409; // Conflict
    } else if (error.message.includes('not found')) {
      statusCode = 404;
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage
    });
  }
});

// Initialize streak สำหรับ user เก่า
router.post('/v2/streak/initialize', auth, async (req, res) => {
  try {
    console.log('🔄 Initializing streak for user:', req.user.id);

    const result = await StreakService.initializeUserStreak(req.user.id);

    res.json({
      success: true,
      data: result,
      message: 'Streak system initialized successfully'
    });
  } catch (error) {
    console.error('Error initializing streak:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Leaderboard
router.get('/v2/streak/leaderboard', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    console.log('🏆 Leaderboard request, limit:', limit);

    // ถ้ายังไม่มี service จริง ให้ใช้ mock data ชั่วคราว
    const mockLeaderboard = [];
    for (let i = 1; i <= limit; i++) {
      mockLeaderboard.push({
        rank: i,
        name: `ผู้ใช้ ${i}`,
        streak: 30 - i,
        totalPoints: 1500 - (i * 50),
        photo: i <= 3 ? `https://example.com/avatar${i}.jpg` : null
      });
    }

    res.json({
      success: true,
      data: mockLeaderboard,
      total: 100,
      page: 1,
      limit: limit
    });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;