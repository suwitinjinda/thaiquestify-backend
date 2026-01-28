const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

// Admin auth helper (check userType)
const adminAuth = async (req, res, next) => {
  if (!req.user || req.user.userType !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};
// Routes สำหรับ Social Quests (เควสจากชุมชน)
// Collection: 'socialquests' - สำหรับ TikTok follow, share URL quests
// แยกจาก 'jobpostings' (งาน/รับจ้าง)
const SocialQuest = require('../models/SocialQuest');
const SocialQuestParticipation = require('../models/SocialQuestParticipation');
const User = require('../models/User');
const QuestSettings = require('../models/QuestSettings');

// ============================================
// QUEST CREATION
// ============================================

/**
 * POST /api/social-quests/create
 * Create a new TikTok quest (Follow or Share URL)
 */
router.post('/create', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const {
      template = 'tiktok_follow', // 'tiktok_follow' or 'tiktok_share_url'
      title,
      description,
      pointsReward = 10,
      pointsCost, // Will be fetched from admin settings if not provided
      maxParticipants = null,
      expiresInDays = 7,
      // For tiktok_share_url template
      shareUrl = null,
      actionType = 'like' // 'like', 'comment', or 'both'
    } = req.body;

    // Get pointsCost from admin settings if not provided
    let finalPointsCost = pointsCost;
    if (!finalPointsCost) {
      const settingKey = template === 'tiktok_follow' 
        ? 'tiktok_follow_cost' 
        : 'tiktok_share_url_cost';
      const setting = await QuestSettings.findOne({ key: settingKey, isActive: true });
      if (setting && setting.value) {
        finalPointsCost = setting.value;
      } else {
        // Default fallback
        finalPointsCost = 5;
      }
    }

    // Validate points
    if (finalPointsCost < 1 || pointsReward < 1) {
      return res.status(400).json({
        success: false,
        message: 'Points ต้องมากกว่า 0'
      });
    }

    // Validate template
    if (!['tiktok_follow', 'tiktok_share_url'].includes(template)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid template type'
      });
    }

    // Template-specific validation
    if (template === 'tiktok_follow') {
      // Check if user has TikTok connected
      const tiktok = user.integrations?.tiktok;
      if (!tiktok || !tiktok.connectedAt || !tiktok.openId) {
        return res.status(400).json({
          success: false,
          message: 'กรุณาเชื่อมต่อ TikTok ก่อนสร้าง quest'
        });
      }
      // If user already has an active TikTok follow quest (same TikTok), return it so frontend can go to edit
      const existingFollow = await SocialQuest.findOne({
        owner: user._id,
        template: 'tiktok_follow',
        status: 'active',
        'tiktokProfile.openId': tiktok.openId
      }).lean();
      if (existingFollow) {
        return res.json({
          success: true,
          alreadyExists: true,
          existingQuestId: existingFollow._id.toString(),
          quest: existingFollow,
          message: 'คุณมีเควส Follow TikTok นี้อยู่แล้ว ไปที่หน้าแก้ไข'
        });
      }
    } else if (template === 'tiktok_share_url') {
      // Validate share URL
      if (!shareUrl || !shareUrl.includes('tiktok.com')) {
        return res.status(400).json({
          success: false,
          message: 'กรุณาระบุ TikTok URL ที่ถูกต้อง'
        });
      }
      
      if (!['like', 'comment', 'both'].includes(actionType)) {
        return res.status(400).json({
          success: false,
          message: 'actionType ต้องเป็น like, comment, หรือ both'
        });
      }
    }

    // Check if user has enough points
    if (user.points < finalPointsCost) {
      return res.status(400).json({
        success: false,
        message: `คะแนนไม่เพียงพอ (ต้องการ ${finalPointsCost} คะแนน)`,
        requiredPoints: finalPointsCost,
        currentPoints: user.points,
        canGetFreeQuest: false
      });
    }

    // Build quest data based on template
    const questData = {
      owner: user._id,
      template: template,
      title: title || (template === 'tiktok_follow' 
        ? `Follow @${user.integrations?.tiktok?.username || user.integrations?.tiktok?.displayName || user.integrations?.tiktok?.openId} on TikTok`
        : 'Like/Comment TikTok Video'),
      description: description || '',
      pointsReward,
      pointsCost: finalPointsCost,
      maxParticipants: maxParticipants || null,
      expiresAt: expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : null,
      status: 'active' // New quests are active immediately so others can join
    };

    // Add template-specific data
    if (template === 'tiktok_follow') {
      const tiktok = user.integrations?.tiktok;
      
      if (!tiktok || !tiktok.username) {
        return res.status(400).json({
          success: false,
          message: 'กรุณาเชื่อมต่อ TikTok ก่อนสร้าง follow quest'
        });
      }
      
      // Use username (e.g., "noom2419") for display and URL
      // Store openId separately for verification purposes
      const usernameForDisplay = tiktok.username || tiktok.displayName || '';
      const usernameForUrl = usernameForDisplay || tiktok.openId;
      const profileUrl = usernameForUrl 
        ? `https://www.tiktok.com/@${usernameForUrl.replace('@', '')}`
        : `https://www.tiktok.com/@${tiktok.openId}`;
      
      // Owner can create follow quests anytime (no block).
      // Only when listing: users who already have this owner in approvedFollowers will not see this quest (one-time per follower).
      const ownerOpenId = tiktok.openId;
      
      if (!ownerOpenId) {
        return res.status(400).json({
          success: false,
          message: 'ไม่พบ TikTok user ID (openId) - ไม่สามารถสร้าง quest ได้'
        });
      }
      
      questData.tiktokProfile = {
        username: usernameForDisplay, // Use actual username for display (e.g., "munmun9913", "noom2419")
        displayName: tiktok.displayName || usernameForDisplay || '', // Display name from TikTok
        profileUrl: profileUrl,
        avatarUrl: tiktok.avatarUrl || '',
        openId: tiktok.openId // Required: unique TikTok identifier for verification
      };
    } else if (template === 'tiktok_share_url') {
      // Extract video ID from URL if possible
      // TikTok URL format: https://www.tiktok.com/@username/video/1234567890
      const videoIdMatch = shareUrl.match(/\/video\/(\d+)/);
      const videoId = videoIdMatch ? videoIdMatch[1] : null;
      
      questData.tiktokShareUrl = {
        url: shareUrl,
        actionType: actionType,
        videoId: videoId,
        thumbnailUrl: '' // Can be fetched later if needed
      };
    }

    // Create quest
    const quest = new SocialQuest(questData);

    console.log(`📝 [CREATE_QUEST] Creating quest with data:`, {
      owner: questData.owner?.toString() || questData.owner,
      title: questData.title,
      template: questData.template,
      status: questData.status,
      tiktokProfile: questData.tiktokProfile
    });

    await quest.save();

    console.log(`✅ [CREATE_QUEST] Quest created successfully:`, {
      _id: quest._id,
      owner: quest.owner.toString(),
      title: quest.title,
      status: quest.status,
      template: quest.template
    });

    // Note: Points are NOT deducted when creating quest
    // Points will be deducted from owner when admin approves the first participation

    res.json({
      success: true,
      quest: quest,
      message: 'สร้าง quest สำเร็จ',
      remainingPoints: user.points
    });
  } catch (error) {
    console.error('❌ Error creating social quest:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้าง quest',
      error: error.message
    });
  }
});

// ============================================
// QUEST LISTING
// ============================================

/**
 * GET /api/social-quests/template-costs
 * Get quest template costs from admin settings (public endpoint for users to know costs)
 */
router.get('/template-costs', async (req, res) => {
  try {
    const followCostSetting = await QuestSettings.findOne({ 
      key: 'tiktok_follow_cost', 
      isActive: true 
    });
    const shareUrlCostSetting = await QuestSettings.findOne({ 
      key: 'tiktok_share_url_cost', 
      isActive: true 
    });

    res.json({
      success: true,
      costs: {
        tiktok_follow: followCostSetting?.value || 5,
        tiktok_share_url: shareUrlCostSetting?.value || 5
      }
    });
  } catch (error) {
    console.error('❌ Error fetching template costs:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการโหลดค่าใช้จ่าย',
      error: error.message
    });
  }
});

/**
 * GET /api/social-quests/list
 * Get all active quests from other users only (excluding owner's own quests)
 */
router.get('/list', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    console.log(`📋 [SOCIAL_QUESTS_LIST] User ID: ${req.user.id} (type: ${typeof req.user.id}), Page: ${page}, Limit: ${limit}`);

    // Convert user.id to ObjectId if it's a string
    const mongoose = require('mongoose');
    const userId = mongoose.Types.ObjectId.isValid(req.user.id) 
      ? new mongoose.Types.ObjectId(req.user.id) 
      : req.user.id;

    console.log(`🔍 [SOCIAL_QUESTS_LIST] Converted User ID: ${userId} (type: ${typeof userId})`);

    // Get current user's approvedFollowers list (TikTok openIds and usernames that have been approved)
    // Check by openId (TikTok user ID) to ensure one-time quest per user
    const currentUser = await User.findById(userId).select('approvedFollowers');
    const approvedOpenIds = currentUser?.approvedFollowers?.map(f => f.tiktokOpenId).filter(Boolean) || [];
    const approvedUsernames = currentUser?.approvedFollowers?.map(f => f.tiktokUsername?.toLowerCase()).filter(Boolean) || [];
    
    console.log(`👥 [SOCIAL_QUESTS_LIST] User has ${approvedOpenIds.length} approved followers (by openId):`, approvedOpenIds);
    console.log(`👥 [SOCIAL_QUESTS_LIST] User has ${approvedUsernames.length} approved followers (by username):`, approvedUsernames);

    // Get active quests from other users only (exclude all own quests)
    const query = {
      owner: { $ne: userId },
      status: 'active',
      $or: [
        { expiresAt: null },
        { expiresAt: { $gte: new Date() } }
      ]
    };

    console.log(`🔍 [SOCIAL_QUESTS_LIST] Query:`, JSON.stringify(query, null, 2));

    const quests = await SocialQuest.find(query)
    .populate('owner', 'name photo integrations.tiktok.username')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(skip)
    .lean();

    console.log(`✅ [SOCIAL_QUESTS_LIST] Found ${quests.length} quests`);
    if (quests.length > 0) {
      console.log(`📝 [SOCIAL_QUESTS_LIST] First quest:`, {
        _id: quests[0]._id,
        title: quests[0].title,
        status: quests[0].status,
        owner: quests[0].owner?._id || quests[0].owner,
        template: quests[0].template
      });
    }

    // Filter out quests where maxParticipants is reached
    // Also filter out follow quests where owner's TikTok username is in approvedFollowers list
    const availableQuests = quests.filter(quest => {
      // Filter out if maxParticipants is reached
      if (quest.maxParticipants && quest.currentParticipants >= quest.maxParticipants) {
        return false;
      }
      
      // For follow quests: filter out if owner's TikTok openId (user ID) is in approvedFollowers list
      // Check by openId first (primary check) - ensures one-time quest per TikTok user
      if (quest.template === 'tiktok_follow') {
        // Get owner's TikTok openId from quest data (primary identifier)
        const ownerTiktokOpenId = quest.tiktokProfile?.openId || 
                                  quest.owner?.integrations?.tiktok?.openId ||
                                  '';
        
        // Check by openId first (most reliable - username can change)
        if (ownerTiktokOpenId && approvedOpenIds.includes(ownerTiktokOpenId)) {
          console.log(`🚫 [SOCIAL_QUESTS_LIST] Filtered out quest ${quest._id} - TikTok user (openId: ${ownerTiktokOpenId}) already in approvedFollowers (one-time quest)`);
          return false;
        }
        
        // Fallback: Also check by username (for backward compatibility)
        const ownerTiktokUsername = quest.tiktokProfile?.username || 
                                    quest.owner?.integrations?.tiktok?.username ||
                                    '';
        
        if (ownerTiktokUsername) {
          const ownerUsernameLower = ownerTiktokUsername.toLowerCase();
          if (approvedUsernames.includes(ownerUsernameLower)) {
            console.log(`🚫 [SOCIAL_QUESTS_LIST] Filtered out quest ${quest._id} - @${ownerTiktokUsername} is already in approvedFollowers (by username)`);
            return false;
          }
        }
      }
      
      return true;
    });

    // Check which quests user has already participated
    const questIds = availableQuests.map(q => q._id);
    const participations = await SocialQuestParticipation.find({
      quest: { $in: questIds },
      participant: req.user.id
    }).lean();

    const participationMap = {};
    participations.forEach(p => {
      participationMap[p.quest.toString()] = p.status;
    });

    // Add participation status to each quest
    const questsWithStatus = availableQuests.map(quest => ({
      ...quest,
      hasParticipated: !!participationMap[quest._id.toString()],
      participationStatus: participationMap[quest._id.toString()] || null
    }));

    // Count total quests matching the same query (for accurate pagination)
    // This should match the query used to fetch quests above
    const totalQuery = {
      owner: { $ne: userId },
      status: 'active',
      $or: [
        { expiresAt: null },
        { expiresAt: { $gte: new Date() } }
      ]
    };
    
    const totalQuests = await SocialQuest.countDocuments(totalQuery);
    
    // Filter out quests where maxParticipants is reached for total count too
    // Also filter out follow quests where owner's TikTok username is in approvedFollowers list
    const allQuestsForCount = await SocialQuest.find(totalQuery)
      .populate('owner', 'integrations.tiktok.username')
      .lean();
    const availableTotal = allQuestsForCount.filter(quest => {
      // Filter out if maxParticipants is reached
      if (quest.maxParticipants && quest.currentParticipants >= quest.maxParticipants) {
        return false;
      }
      
      // For follow quests: filter out if owner's TikTok openId (user ID) is in approvedFollowers list
      // Check by openId first (primary check) - ensures one-time quest per TikTok user
      if (quest.template === 'tiktok_follow') {
        // Get owner's TikTok openId from quest data (primary identifier)
        const ownerTiktokOpenId = quest.tiktokProfile?.openId || 
                                  quest.owner?.integrations?.tiktok?.openId ||
                                  '';
        
        // Check by openId first (most reliable - username can change)
        if (ownerTiktokOpenId && approvedOpenIds.includes(ownerTiktokOpenId)) {
          return false;
        }
        
        // Fallback: Also check by username (for backward compatibility)
        const ownerTiktokUsername = quest.tiktokProfile?.username || 
                                    quest.owner?.integrations?.tiktok?.username ||
                                    '';
        
        if (ownerTiktokUsername) {
          const ownerUsernameLower = ownerTiktokUsername.toLowerCase();
          if (approvedUsernames.includes(ownerUsernameLower)) {
            return false;
          }
        }
      }
      
      return true;
    }).length;

    res.json({
      success: true,
      quests: questsWithStatus,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: availableTotal,
        pages: Math.ceil(availableTotal / limit)
      }
    });
  } catch (error) {
    console.error('❌ Error fetching social quests:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการโหลด quests',
      error: error.message
    });
  }
});

/**
 * GET /api/social-quests/my-quests
 * Get user's own created quests
 */
router.get('/my-quests', auth, async (req, res) => {
  try {
    console.log(`📝 [MY_QUESTS] Fetching quests for owner: ${req.user.id}`);
    const quests = await SocialQuest.find({
      owner: req.user.id
    })
    .populate('owner', 'name photo')
    .sort({ createdAt: -1 })
    .lean();

    console.log(`✅ [MY_QUESTS] Found ${quests.length} quests for owner ${req.user.id}`);

    // Get participation stats for each quest
    const questIds = quests.map(q => q._id);
    const participations = await SocialQuestParticipation.find({
      quest: { $in: questIds }
    }).lean();

    const statsMap = {};
    participations.forEach(p => {
      const questId = p.quest.toString();
      if (!statsMap[questId]) {
        statsMap[questId] = {
          total: 0,
          pending: 0,
          approved: 0,
          denied: 0
        };
      }
      statsMap[questId].total++;
      // Map status correctly
      if (p.status === 'approved') {
        statsMap[questId].approved++;
      } else if (p.status === 'denied') {
        statsMap[questId].denied++;
      } else {
        statsMap[questId].pending++;
      }
    });

    const questsWithStats = quests.map(quest => ({
      ...quest,
      stats: statsMap[quest._id.toString()] || {
        total: 0,
        pending: 0,
        approved: 0,
        denied: 0
      }
    }));

    res.json({
      success: true,
      quests: questsWithStats
    });
  } catch (error) {
    console.error('❌ Error fetching user quests:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการโหลด quests',
      error: error.message
    });
  }
});

/**
 * GET /api/social-quests/owner/pending-count
 * Count of pending participations on quests owned by current user (for badge/notification)
 */
router.get('/owner/pending-count', auth, async (req, res) => {
  try {
    const count = await SocialQuestParticipation.countDocuments({
      status: 'pending',
      quest: { $in: await SocialQuest.find({ owner: req.user.id }).distinct('_id') }
    });
    res.json({ success: true, count: count || 0 });
  } catch (error) {
    console.error('❌ Error fetching owner pending count:', error);
    res.status(500).json({ success: false, count: 0 });
  }
});

// ============================================
// QUEST PARTICIPATION
// ============================================

/**
 * POST /api/social-quests/:questId/participate
 * User clicks to participate in a quest
 */
router.post('/:questId/participate', auth, async (req, res) => {
  try {
    const quest = await SocialQuest.findById(req.params.questId);
    if (!quest) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบ quest'
      });
    }

    // Check if quest is active
    if (!quest.isActive()) {
      return res.status(400).json({
        success: false,
        message: 'Quest นี้ไม่สามารถเข้าร่วมได้'
      });
    }

    // Check if user is trying to participate in their own quest
    if (quest.owner.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'ไม่สามารถเข้าร่วม quest ของตัวเองได้'
      });
    }

    // Check if user already participated
    const existing = await SocialQuestParticipation.findOne({
      quest: quest._id,
      participant: req.user.id
    });

    if (existing) {
      return res.json({
        success: true,
        participation: existing,
        message: 'คุณเข้าร่วม quest นี้แล้ว',
        status: existing.status
      });
    }

    // Create participation (proof submission is optional and can be done later)
    const participation = new SocialQuestParticipation({
      quest: quest._id,
      participant: req.user.id,
      status: 'pending'
    });

    await participation.save();

    // Return quest info with participation status
    res.json({
      success: true,
      participation: participation,
      quest: quest,
      message: 'เข้าร่วม quest สำเร็จ กรุณา follow และรอตรวจสอบ'
    });
  } catch (error) {
    console.error('❌ Error participating in quest:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการเข้าร่วม quest',
      error: error.message
    });
  }
});

/**
 * DELETE /api/social-quests/participate/:participationId
 * User cancels/withdraws their participation
 */
router.delete('/participate/:participationId', auth, async (req, res) => {
  try {
    const participation = await SocialQuestParticipation.findById(req.params.participationId)
      .populate('quest');

    if (!participation) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบการเข้าร่วม'
      });
    }

    // Check if user owns this participation
    if (participation.participant.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์ยกเลิกการเข้าร่วมนี้'
      });
    }

    // Only allow cancellation if status is pending
    if (participation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'ไม่สามารถยกเลิกได้ เนื่องจากสถานะไม่ใช่รอการอนุมัติ'
      });
    }

    // Delete the participation
    await SocialQuestParticipation.findByIdAndDelete(participation._id);

    // Update quest participation count
    await SocialQuest.findByIdAndUpdate(participation.quest._id, {
      $inc: { currentParticipants: -1 }
    });

    console.log(`✅ Participation ${req.params.participationId} cancelled by user ${req.user.id}`);

    res.json({
      success: true,
      message: 'ยกเลิกการเข้าร่วมเรียบร้อยแล้ว'
    });
  } catch (error) {
    console.error('Error cancelling participation:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการยกเลิกการเข้าร่วม'
    });
  }
});

/**
 * GET /api/social-quests/:questId
 * Get quest details
 */
router.get('/:questId', auth, async (req, res) => {
  try {
    const quest = await SocialQuest.findById(req.params.questId)
      .populate('owner', 'name photo')
      .lean();

    if (!quest) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบ quest'
      });
    }

    // Check participation status
    const participation = await SocialQuestParticipation.findOne({
      quest: quest._id,
      participant: req.user.id
    }).lean();

    res.json({
      success: true,
      quest: {
        ...quest,
        hasParticipated: !!participation,
        participationStatus: participation?.status || null
      }
    });
  } catch (error) {
    console.error('❌ Error fetching quest:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการโหลด quest',
      error: error.message
    });
  }
});

/**
 * PATCH /api/social-quests/:questId/cancel
 * Owner cancels own quest (sets status to cancelled)
 */
router.patch('/:questId/cancel', auth, async (req, res) => {
  try {
    const quest = await SocialQuest.findById(req.params.questId);
    if (!quest) {
      return res.status(404).json({ success: false, message: 'ไม่พบ quest' });
    }
    if (quest.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'เฉพาะเจ้าของ quest เท่านั้นที่ยกเลิกได้' });
    }
    if (quest.status !== 'active') {
      return res.status(400).json({ success: false, message: 'ยกเลิกได้เฉพาะ quest ที่สถานะ active' });
    }
    quest.status = 'cancelled';
    quest.cancelledAt = new Date();
    quest.cancellationReason = req.body.reason || 'เจ้าของยกเลิก';
    await quest.save();
    res.json({ success: true, quest });
  } catch (error) {
    console.error('❌ Error cancelling quest:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PATCH /api/social-quests/:questId
 * Owner updates own quest (title, description, pointsReward, maxParticipants, expiresAt)
 */
router.patch('/:questId', auth, async (req, res) => {
  try {
    const quest = await SocialQuest.findById(req.params.questId);
    if (!quest) {
      return res.status(404).json({ success: false, message: 'ไม่พบ quest' });
    }
    if (quest.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'เฉพาะเจ้าของ quest เท่านั้นที่แก้ไขได้' });
    }
    const { title, description, pointsReward, maxParticipants, expiresAt } = req.body;
    if (title !== undefined) quest.title = title;
    if (description !== undefined) quest.description = description;
    if (pointsReward !== undefined) {
      const n = parseInt(pointsReward, 10);
      if (isNaN(n) || n < 1) {
        return res.status(400).json({ success: false, message: 'คะแนนรางวัลต้องเป็นเลขจำนวนเต็มอย่างน้อย 1' });
      }
      quest.pointsReward = n;
    }
    if (maxParticipants !== undefined) {
      const m = maxParticipants === '' || maxParticipants === null ? null : parseInt(maxParticipants, 10);
      if (m !== null && (isNaN(m) || m < 0)) {
        return res.status(400).json({ success: false, message: 'จำนวนผู้เข้าร่วมสูงสุดต้องเป็นเลขจำนวนเต็มหรือว่าง' });
      }
      if (m !== null && quest.currentParticipants > m) {
        return res.status(400).json({ success: false, message: `จำนวนผู้เข้าร่วมสูงสุดต้องไม่น้อยกว่าผู้เข้าร่วมปัจจุบัน (${quest.currentParticipants})` });
      }
      quest.maxParticipants = m;
    }
    if (expiresAt !== undefined) quest.expiresAt = expiresAt ? new Date(expiresAt) : null;
    await quest.save();
    res.json({ success: true, quest });
  } catch (error) {
    console.error('❌ Error updating quest:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// ADMIN VERIFICATION
// ============================================

/**
 * GET /api/social-quests/admin/pending
 * Get all pending participations (admin only)
 */
router.get('/admin/pending', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const participations = await SocialQuestParticipation.find({
      status: 'pending'
    })
    .populate('quest', 'title tiktokProfile owner')
    .populate('participant', 'name email photo')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(skip)
    .lean();

    const total = await SocialQuestParticipation.countDocuments({
      status: 'pending'
    });

    res.json({
      success: true,
      participations: participations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Error fetching pending participations:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการโหลดข้อมูล',
      error: error.message
    });
  }
});

/**
 * POST /api/social-quests/admin/verify/:participationId
 * Admin approves or denies a participation
 */
router.post('/admin/verify/:participationId', adminAuth, async (req, res) => {
  try {
    const { action, note } = req.body; // action: 'approve' or 'deny'

    if (!['approve', 'deny'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Use "approve" or "deny"'
      });
    }

    const participation = await SocialQuestParticipation.findById(req.params.participationId)
      .populate('quest')
      .populate('participant');

    if (!participation) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบ participation'
      });
    }

    if (participation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Participation นี้ได้รับการตรวจสอบแล้ว (${participation.status})`
      });
    }

    // Update participation
    participation.status = action === 'approve' ? 'approved' : 'denied';
    participation.verification.verifiedBy = req.user.id;
    participation.verification.verifiedAt = new Date();
    participation.verification.verificationNote = note || '';

    if (action === 'approve') {
      // Award points to participant
      const participant = await User.findById(participation.participant._id);
      participant.points += participation.quest.pointsReward;
      await participant.save();

      participation.pointsEarned = participation.quest.pointsReward;
      participation.pointsAwardedAt = new Date();

      // Increment quest participant count
      await participation.quest.addParticipant();
    }

    await participation.save();

    res.json({
      success: true,
      participation: participation,
      message: action === 'approve' ? 'อนุมัติสำเร็จ' : 'ปฏิเสธสำเร็จ'
    });
  } catch (error) {
    console.error('❌ Error verifying participation:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการตรวจสอบ',
      error: error.message
    });
  }
});

module.exports = router;
