// routes/touristQuests.js
// Auto-create and manage tourist check-in quests
const express = require('express');
const router = express.Router();
const Quest = require('../models/Quest');
const QuestSettings = require('../models/QuestSettings');
const Shop = require('../models/Shop');
const User = require('../models/User');
const UserQuest = require('../models/UserQuest');
const { auth } = require('../middleware/auth');
const TouristAttraction = require('../models/TouristAttraction');

// Tourist quests don't use shopId - they use touristId instead

/**
 * Get or create tourist check-in quest for an attraction
 * Quest is automatically created if doesn't exist
 */
router.get('/attraction/:attractionId/quest', auth, async (req, res) => {
  try {
    const { attractionId } = req.params;

    // Get attraction data from database
    const attraction = await TouristAttraction.findOne({ id: attractionId, isActive: true });
    if (!attraction) {
      return res.status(404).json({
        success: false,
        message: 'Tourist attraction not found'
      });
    }

    // Get system user for createdBy field
    let systemUser = await User.findOne({ email: 'system@thaiquestify.com' });
    if (!systemUser) {
      systemUser = new User({
        name: 'System',
        email: 'system@thaiquestify.com',
        userType: 'admin',
        password: 'system', // Not used for system account
      });
      await systemUser.save();
    }

    // Check if quest already exists for this attraction (using touristId)
    let quest = await Quest.findOne({
      touristId: attractionId,
      type: 'location_checkin',
      status: 'active'
    });

    if (!quest) {
      // Get points from settings (default 10)
      const pointsSetting = await QuestSettings.getSetting('tourist_checkin_points') || 10;

      // Create quest automatically (using touristId instead of shopId)
      // Use Facebook engagement verification instead of GPS location
      quest = new Quest({
        name: `เช็คอินที่ ${attraction.name}`,
        description: `เช็คอินที่ ${attraction.name}${attraction.description ? ` - ${attraction.description}` : ''}`,
        // Don't use shopId or shop for tourist quests
        touristId: attractionId, // Use touristId instead
        type: 'social_media', // Changed from location_checkin to social_media
        verificationMethod: 'facebook_api', // Changed from location_verification to facebook_api
        category: 'check-in',
        rewardAmount: 0, // No money reward for tourist check-in
        rewardPoints: pointsSetting,
        budget: 0,
        maxParticipants: 999999, // Unlimited participants
        currentParticipants: 0,
        duration: 365, // Quest lasts 1 year
        locationName: attraction.name, // Keep for reference
        address: attraction.address || `${attraction.district}, ${attraction.province}`,
        coordinates: `${attraction.coordinates.latitude},${attraction.coordinates.longitude}`, // Keep for reference
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        isTouristQuest: true,
        touristAttractionId: attractionId,
        isOneTimeQuest: true, // One-time quest flag
        createdBy: systemUser._id, // System user created
        instructions: `โพสต์บน Facebook พร้อม hashtag #${attraction.name.replace(/\s+/g, '')} หรือ #ThaiQuestify เพื่อเช็คอินที่ ${attraction.name} (ทำได้ครั้งเดียว)`
      });
      await quest.save();
    }

    // Check if user already completed this quest
    const userQuest = await UserQuest.findOne({
      userId: req.user.id,
      questId: quest._id
    });

    const isCompleted = userQuest?.status === 'completed';
    const isParticipating = !!userQuest;

    res.json({
      success: true,
      quest: {
        _id: quest._id,
        name: quest.name,
        description: quest.description,
        type: quest.type,
        rewardPoints: quest.rewardPoints,
        locationName: quest.locationName,
        coordinates: quest.coordinates,
        radius: quest.radius,
        isOneTimeQuest: quest.isOneTimeQuest
      },
      attraction: {
        id: attraction.id,
        name: attraction.name,
        description: attraction.description,
        province: attraction.province,
        district: attraction.district,
        coordinates: attraction.coordinates,
        checkInRadius: attraction.checkInRadius
      },
      userStatus: {
        isParticipating,
        isCompleted,
        canParticipate: !isCompleted // Can only do once
      }
    });
  } catch (error) {
    console.error('Error getting tourist quest:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tourist quest',
      error: error.message
    });
  }
});

/**
 * Check location distance before allowing quest
 * This endpoint checks if user is within the required radius
 */
router.post('/attraction/:attractionId/check-location', auth, async (req, res) => {
  try {
    const { attractionId } = req.params;
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Missing coordinates'
      });
    }

    // Get attraction data from database
    const attraction = await TouristAttraction.findOne({ id: attractionId, isActive: true });
    if (!attraction) {
      return res.status(404).json({
        success: false,
        message: 'Tourist attraction not found'
      });
    }

    // Verify location distance
    const locationVerificationService = require('../service/locationVerificationService');
    const userCoordinates = { latitude: parseFloat(latitude), longitude: parseFloat(longitude) };
    const targetCoordinates = {
      latitude: attraction.coordinates.latitude,
      longitude: attraction.coordinates.longitude
    };
    const radius = attraction.checkInRadius || 100;

    const verificationResult = await locationVerificationService.verifyLocation(
      userCoordinates,
      targetCoordinates,
      radius
    );

    return res.json({
      success: true,
      withinRange: verificationResult.isValid,
      distance: verificationResult.distance,
      radius: radius,
      message: verificationResult.isValid
        ? `คุณอยู่ภายในระยะการเช็คอิน (ระยะห่าง: ${verificationResult.distance.toFixed(0)} เมตร)`
        : `คุณอยู่ห่างจากสถานที่ ${verificationResult.distance.toFixed(0)} เมตร กรุณาเข้าใกล้สถานที่มากขึ้น (รัศมี: ${radius} เมตร)`
    });
  } catch (error) {
    console.error('Error checking location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check location',
      error: error.message
    });
  }
});

/**
 * Verify tourist check-in quest (Facebook engagement after location check)
 */
router.post('/attraction/:attractionId/verify', auth, async (req, res) => {
  try {
    const { attractionId } = req.params;
    const { latitude, longitude, hashtag } = req.body;

    // Get attraction data from database
    const attraction = await TouristAttraction.findOne({ id: attractionId, isActive: true });
    if (!attraction) {
      return res.status(404).json({
        success: false,
        message: 'Tourist attraction not found'
      });
    }

    // Get quest
    const quest = await Quest.findOne({
      touristId: attractionId,
      status: 'active'
    });

    if (!quest) {
      return res.status(404).json({
        success: false,
        message: 'Quest not found for this attraction'
      });
    }

    // Check if user already completed this quest (one-time quest)
    const existingUserQuest = await UserQuest.findOne({
      userId: req.user.id,
      questId: quest._id,
      status: 'completed'
    });

    if (existingUserQuest) {
      return res.status(400).json({
        success: false,
        message: 'คุณทำเควสนี้แล้ว (ทำได้ครั้งเดียว)',
        alreadyCompleted: true
      });
    }

    // Step 1: Verify location distance (REQUIRED)
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุตำแหน่งปัจจุบันเพื่อตรวจสอบระยะห่าง'
      });
    }

    const locationVerificationService = require('../service/locationVerificationService');
    const userCoordinates = { latitude: parseFloat(latitude), longitude: parseFloat(longitude) };
    const targetCoordinates = {
      latitude: attraction.coordinates.latitude,
      longitude: attraction.coordinates.longitude
    };
    const radius = attraction.checkInRadius || 100;

    const locationCheck = await locationVerificationService.verifyLocation(
      userCoordinates,
      targetCoordinates,
      radius
    );

    if (!locationCheck.isValid) {
      return res.status(400).json({
        success: false,
        verified: false,
        message: `คุณอยู่ห่างจากสถานที่ ${locationCheck.distance.toFixed(0)} เมตร กรุณาเข้าใกล้สถานที่มากขึ้น (รัศมี: ${radius} เมตร)`,
        distance: locationCheck.distance,
        radius: radius
      });
    }

    // Step 2: Verify Facebook engagement (hashtag post)
    // Use the existing Facebook engagement verification endpoint
    const axios = require('axios');
    const User = require('../models/User');
    const userWithFacebook = await User.findById(req.user.id).select('integrations');
    const facebook = userWithFacebook?.integrations?.facebook;

    if (!facebook?.connectedAt || !facebook?.userId) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาเชื่อมต่อ Facebook ก่อน (หน้าโปรไฟล์)'
      });
    }

    if (!facebook?.accessToken) {
      return res.status(400).json({
        success: false,
        message: 'Facebook access token not available'
      });
    }

    // Verify hashtag post
    // Support multiple hashtags: #ThaiQuestify, #ThaiQuestifyOffice, or custom hashtag from name
    const defaultHashtag = `#${attraction.name.replace(/\s+/g, '')}`;
    const hashtagToCheck = hashtag || defaultHashtag || '#ThaiQuestify';
    // Also check for #ThaiQuestify as a fallback
    const alternativeHashtags = ['#thaiquestify', '#ThaiQuestify', defaultHashtag.toLowerCase()].filter(h => h && h !== hashtagToCheck.toLowerCase());

    try {
      // Try to get token info to check permissions
      let tokenInfo = null;
      try {
        const tokenResp = await axios.get(
          `https://graph.facebook.com/v18.0/debug_token?input_token=${encodeURIComponent(facebook.accessToken)}&access_token=${facebook.accessToken}`
        );
        tokenInfo = tokenResp.data?.data;
        console.log('🔍 [DEBUG] Access token info:', {
          app_id: tokenInfo?.app_id,
          user_id: tokenInfo?.user_id,
          scopes: tokenInfo?.scopes || tokenInfo?.granted_scopes,
          expires_at: tokenInfo?.expires_at ? new Date(tokenInfo.expires_at * 1000).toISOString() : null,
          is_valid: tokenInfo?.is_valid,
          metadata: tokenInfo?.metadata
        });
      } catch (tokenError) {
        console.warn('⚠️ [DEBUG] Could not verify token:', tokenError.message);
      }

      console.log('🔍 [DEBUG] Starting Facebook post verification:', {
        userId: req.user.id,
        facebookUserId: facebook.userId,
        hashtagToCheck,
        attractionName: attraction.name,
        hasAccessToken: !!facebook.accessToken,
        accessTokenPreview: facebook.accessToken?.substring(0, 20) + '...',
        tokenScopes: tokenInfo?.scopes || tokenInfo?.granted_scopes || 'Unknown',
        hasUserPostsScope: (tokenInfo?.scopes || tokenInfo?.granted_scopes || []).includes('user_posts')
      });

      // Try multiple endpoints to get posts
      // Use user ID instead of 'me' to avoid Pages Experience issue
      let userPosts = [];
      let apiError = null;
      const userId = facebook.userId || accountId;

      try {
        console.log('🔍 [DEBUG] Attempting to fetch from {user-id}/posts endpoint...');
        console.log('🔍 [DEBUG] Using user ID:', userId);
        const postsResp = await axios.get(
          `https://graph.facebook.com/v18.0/${userId}/posts?fields=id,message,place,created_time,privacy&limit=200&access_token=${encodeURIComponent(facebook.accessToken)}`
        );
        const responseData = postsResp.data || {};
        console.log('✅ [DEBUG] {user-id}/posts response:', {
          status: postsResp.status,
          statusText: postsResp.statusText,
          dataLength: responseData.data?.length || 0,
          hasData: !!responseData.data,
          isArray: Array.isArray(responseData.data),
          error: responseData.error,
          paging: responseData.paging ? 'Has paging' : 'No paging',
          responseKeys: Object.keys(responseData),
          fullResponse: JSON.stringify(responseData, null, 2) // Full response for debugging
        });
        userPosts = responseData.data || [];

        // Check if response has error
        if (responseData.error) {
          console.error('⚠️ [DEBUG] Facebook API returned error in response:', {
            error: responseData.error,
            message: responseData.error.message,
            type: responseData.error.type,
            code: responseData.error.code,
            error_subcode: responseData.error.error_subcode,
            fbtrace_id: responseData.error.fbtrace_id
          });
        }

        // If no posts and no error, this might be a permission issue
        if (userPosts.length === 0 && !responseData.error) {
          console.warn('⚠️ [DEBUG] No posts returned but no error. Possible reasons:');
          console.warn('  1. Access token missing user_posts permission');
          console.warn('  2. All posts are private/Friends only');
          console.warn('  3. User has no posts');
          console.warn('  4. Posts are outside the time range (but API should still return them)');
        }
      } catch (postsError) {
        console.error('❌ [DEBUG] {user-id}/posts endpoint failed:', {
          message: postsError.message,
          status: postsError.response?.status,
          errorData: postsError.response?.data
        });
        apiError = postsError;

        // Try alternative: me/feed endpoint
        try {
          console.log('🔍 [DEBUG] Trying me/feed endpoint as fallback...');
          const feedResp = await axios.get(
            `https://graph.facebook.com/v18.0/${userId}/feed?fields=id,message,place,created_time,privacy&limit=200&access_token=${encodeURIComponent(facebook.accessToken)}`
          );
          console.log('✅ [DEBUG] {user-id}/feed response:', {
            status: feedResp.status,
            dataLength: feedResp.data?.data?.length || 0,
            hasData: !!feedResp.data?.data
          });
          userPosts = feedResp.data?.data || [];
        } catch (feedError) {
          // Check if error is about Pages Experience
          const errorSubcode = feedError.response?.data?.error?.error_subcode;
          const errorMsg = feedError.response?.data?.error?.error_user_msg || '';

          if (errorSubcode === 2069030 || errorMsg.includes('New Pages Experience')) {
            console.error('❌ [DEBUG] ERROR: Account is using New Pages Experience which is not supported');
            console.error('   Solution: User must use a Personal Facebook account, not a Page');
            console.error('   Or: Connect as Page admin and use Page API endpoints');
          }

          console.error('❌ [DEBUG] {user-id}/feed endpoint also failed:', {
            message: feedError.message,
            status: feedError.response?.status,
            errorData: feedError.response?.data
          });
        }
      }

      console.log('🔍 [DEBUG] Posts retrieved:', {
        totalPosts: userPosts.length,
        firstFewPosts: userPosts.slice(0, 3).map(p => ({
          id: p.id,
          hasMessage: !!p.message,
          messagePreview: p.message?.substring(0, 50),
          hasPlace: !!p.place,
          placeName: p.place?.name,
          createdTime: p.created_time,
          privacy: p.privacy?.value
        }))
      });
      const lowerCaseHashtag = hashtagToCheck.toLowerCase();
      const lowerCaseAlternativeHashtags = alternativeHashtags.map(h => h.toLowerCase());
      const now = new Date();
      const timeLimit = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days

      console.log('🔍 [DEBUG] Hashtag search criteria:', {
        primaryHashtag: hashtagToCheck,
        alternativeHashtags: alternativeHashtags,
        lowerCasePrimary: lowerCaseHashtag,
        lowerCaseAlternatives: lowerCaseAlternativeHashtags
      });

      const matchingPosts = userPosts.filter(post => {
        const postMessage = post.message?.toLowerCase() || '';
        const postCreatedTime = new Date(post.created_time);
        const isInTimeRange = postCreatedTime >= timeLimit;

        // Check if post has primary hashtag
        const hasPrimaryHashtag = postMessage.includes(lowerCaseHashtag);

        // Check if post has any alternative hashtag
        const hasAlternativeHashtag = lowerCaseAlternativeHashtags.some(altHashtag => postMessage.includes(altHashtag));
        const foundAltHashtags = lowerCaseAlternativeHashtags.filter(altHashtag => postMessage.includes(altHashtag));
        const hasHashtag = hasPrimaryHashtag || hasAlternativeHashtag;

        // Check if post has check-in location (place)
        // Also check if place name matches attraction name (optional, for better accuracy)
        const hasPlace = !!post.place;
        const placeName = post.place?.name?.toLowerCase() || '';
        const attractionNameLower = attraction.name.toLowerCase();
        const placeMatches = placeName.includes(attractionNameLower) || attractionNameLower.includes(placeName);

        // Match if:
        // 1. Has hashtag in message (primary or alternative), OR
        // 2. Has check-in location (place), OR  
        // 3. Has check-in location with matching place name
        const matches = (hasHashtag || hasPlace || placeMatches) && isInTimeRange;

        if (matches) {
          console.log('✅ [DEBUG] Matching post found:', {
            postId: post.id,
            hasPrimaryHashtag,
            hasAlternativeHashtag,
            foundAltHashtags,
            hasPlace,
            placeName: post.place?.name,
            attractionName: attraction.name,
            message: post.message?.substring(0, 80),
            createdTime: post.created_time,
            isInTimeRange
          });
        }

        return matches;
      });

      if (matchingPosts.length === 0) {
        // Debug: Log all posts for troubleshooting
        console.log('❌ [DEBUG] No matching posts found. Detailed analysis:', {
          totalPosts: userPosts.length,
          hashtagSearched: hashtagToCheck,
          attractionName: attraction.name,
          timeLimit: timeLimit.toISOString(),
          recentPosts: userPosts.slice(0, 10).map(p => {
            const postMsg = p.message?.toLowerCase() || '';
            const hasHashtag = postMsg.includes(hashtagToCheck.toLowerCase());
            const placeName = p.place?.name?.toLowerCase() || '';
            const placeMatches = placeName.includes(attraction.name.toLowerCase()) ||
              attraction.name.toLowerCase().includes(placeName);
            return {
              id: p.id,
              hasMessage: !!p.message,
              messagePreview: p.message?.substring(0, 80),
              hasHashtag,
              hasPlace: !!p.place,
              placeName: p.place?.name,
              placeMatches,
              createdTime: p.created_time,
              createdTimeDate: new Date(p.created_time).toISOString(),
              isInTimeRange: new Date(p.created_time) >= timeLimit,
              privacy: p.privacy?.value
            };
          }),
          apiError: apiError ? {
            message: apiError.message,
            status: apiError.response?.status,
            errorCode: apiError.response?.data?.error?.code,
            errorMessage: apiError.response?.data?.error?.message,
            errorType: apiError.response?.data?.error?.type
          } : null
        });

        // Check if missing user_posts permission
        const missingPermission = !(tokenInfo?.scopes || tokenInfo?.granted_scopes || []).includes('user_posts');

        // Check for Pages Experience error
        const isPagesExperienceError = apiError?.response?.data?.error?.error_subcode === 2069030 ||
          apiError?.response?.data?.error?.error_user_msg?.includes('New Pages Experience') ||
          apiError?.response?.data?.error?.error_user_title?.includes('New Pages Experience');

        let errorMessage = `ไม่พบโพสต์บน Facebook ที่มี hashtag ${hashtagToCheck} หรือ check-in location ใน 7 วันที่ผ่านมา\n\n`;

        if (isPagesExperienceError) {
          errorMessage += `❌ ปัญหา: Facebook account ใช้ "New Pages Experience" ซึ่งไม่รองรับ\n\n`;
          errorMessage += `Facebook API ไม่รองรับการดึงโพสต์จาก New Pages Experience\n\n`;
          errorMessage += `วิธีแก้:\n`;
          errorMessage += `1. ไปที่หน้าโปรไฟล์ในแอป\n`;
          errorMessage += `2. กด "Disconnect Facebook"\n`;
          errorMessage += `3. กด "Connect Facebook" อีกครั้ง\n`;
          errorMessage += `4. เลือก Personal Facebook account (ไม่ใช่ Page)\n\n`;
          errorMessage += `หมายเหตุ: ต้องใช้ Personal Facebook account เท่านั้น\n`;
          errorMessage += `Page หรือ New Pages Experience ไม่รองรับ`;
        } else if (missingPermission) {
          errorMessage += `⚠️ ปัญหา: Access token ไม่มี permission "user_posts"\n\n`;
          errorMessage += `กรุณา:\n`;
          errorMessage += `1. ไปที่หน้าโปรไฟล์\n`;
          errorMessage += `2. กด Disconnect Facebook\n`;
          errorMessage += `3. กด Connect Facebook อีกครั้ง\n`;
          errorMessage += `4. อนุญาต permission "user_posts" เมื่อ Facebook ถาม\n\n`;
          errorMessage += `หมายเหตุ: ถ้าไม่เห็น permission "user_posts" อาจต้องส่ง App Review request ให้ Facebook`;
        } else {
          errorMessage += `กรุณา:\n`;
          errorMessage += `1. โพสต์บน Facebook พร้อม hashtag ${hashtagToCheck}\n`;
          errorMessage += `2. หรือทำ Check-in ที่สถานที่ "${attraction.name}" บน Facebook\n`;
          errorMessage += `3. ตรวจสอบว่าโพสต์เป็น Public\n`;
          errorMessage += `4. รอสักครู่แล้วลองอีกครั้ง (Facebook API อาจมี delay)`;
        }

        return res.status(400).json({
          success: false,
          verified: false,
          message: errorMessage,
          hashtag: hashtagToCheck,
          attractionName: attraction.name,
          missingPermission: missingPermission,
          tokenScopes: tokenInfo?.scopes || tokenInfo?.granted_scopes || []
        });
      }
    } catch (fbError) {
      console.error('Facebook API error:', fbError?.response?.data || fbError);
      const errorData = fbError?.response?.data?.error || {};
      const errorCode = errorData.code;
      const errorMessage = errorData.message || fbError.message;

      if (errorCode === 200 || errorMessage?.includes('permission')) {
        return res.status(403).json({
          success: false,
          message: 'Facebook permission required. Please reconnect Facebook with user_posts permission.',
          error: errorMessage,
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to verify Facebook engagement',
        error: errorMessage,
      });
    }

    // Step 3: Both location and Facebook engagement verified - Complete quest
    // Create or update user quest participation
    let userQuest = await UserQuest.findOne({
      userId: req.user.id,
      questId: quest._id
    });

    if (!userQuest) {
      userQuest = new UserQuest({
        userId: req.user.id,
        questId: quest._id,
        status: 'completed',
        verifiedAt: new Date(),
        verificationData: {
          latitude,
          longitude,
          distance: locationCheck.distance,
          attractionId,
          hashtag: hashtagToCheck,
          facebookVerified: true,
          locationVerified: true
        },
        completedAt: new Date()
      });
    } else {
      userQuest.status = 'completed';
      userQuest.verifiedAt = new Date();
      userQuest.verificationData = {
        latitude,
        longitude,
        distance: locationCheck.distance,
        attractionId,
        hashtag: hashtagToCheck,
        facebookVerified: true,
        locationVerified: true
      };
      userQuest.completedAt = new Date();
    }
    await userQuest.save();

    // Add points to user
    const userForPoints = await User.findById(req.user.id);
    if (userForPoints) {
      userForPoints.points = (userForPoints.points || 0) + quest.rewardPoints;
      await userForPoints.save();
    }

    // Update quest participants count
    quest.currentParticipants = (quest.currentParticipants || 0) + 1;
    await quest.save();

    // Auto-update coordinates from check-in location
    try {
      const autoCoordinateUpdateService = require('../services/autoCoordinateUpdateService');
      const updateResult = await autoCoordinateUpdateService.addCheckInLocation(
        attractionId,
        latitude,
        longitude,
        req.user.id,
        locationCheck.distance
      );

      if (updateResult.updated) {
        console.log(`✅ Auto-updated coordinates for ${attraction.name} based on check-ins`);
      }
    } catch (updateError) {
      // Don't fail the request if coordinate update fails
      console.error('Error updating coordinates (non-critical):', updateError);
    }

    res.json({
      success: true,
      verified: true,
      message: 'เช็คอินสำเร็จ! คุณได้โพสต์บน Facebook และอยู่ภายในระยะที่กำหนด',
      reward: {
        points: quest.rewardPoints
      },
      completedAt: userQuest.completedAt,
      verification: {
        location: {
          verified: true,
          distance: locationCheck.distance,
          radius: radius
        },
        facebook: {
          verified: true,
          hashtag: hashtagToCheck
        }
      }
    });
  } catch (error) {
    console.error('Error verifying tourist quest:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify tourist quest',
      error: error.message
    });
  }
});

module.exports = router;
