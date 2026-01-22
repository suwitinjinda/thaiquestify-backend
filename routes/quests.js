// routes/quests.js - COMPLETE CORRECTED VERSION
const express = require('express');
const router = express.Router();

// REQUIRED IMPORTS - MAKE SURE THESE ARE AT THE TOP
const mongoose = require('mongoose');
const Quest = require('../models/Quest');
const QuestTemplate = require('../models/QuestTemplate'); // ADD THIS LINE
const Shop = require('../models/Shop'); // ADD THIS LINE
const User = require('../models/User'); // ADD THIS LINE if needed
const UserQuest = require('../models/UserQuest');
const QuestSettings = require('../models/QuestSettings');
const PointTransaction = require('../models/PointTransaction');
const { auth } = require('../middleware/auth');
const { provinceGroups, getRegionByProvince, getProvincesByRegion } = require('../data/thaiProvinces');

// Get quest statistics by region
router.get('/stats/by-region', async (req, res) => {
  try {
    console.log('📊 Fetching REAL quest stats by region from database');
    console.log('🗺️ Using province groups from thaiProvinces.js');

    const stats = {};
    
    // Get all active quests with shop information
    const activeQuests = await Quest.find({
      status: 'active',
      endDate: { $gte: new Date() }
    })
    .populate('shop', 'province shopName') // Changed from shopId to shop
    .lean();

    console.log(`📊 Found ${activeQuests.length} active quests total`);

    // Get all active shops
    const activeShops = await Shop.find({
      status: 'active'
    }).lean();

    console.log(`🏪 Found ${activeShops.length} active shops total`);

    // Initialize stats for all regions
    Object.keys(provinceGroups).forEach(region => {
      stats[region] = {
        activeQuests: 0,
        popularProvinces: [],
        totalShops: 0,
        trending: getTrendingForRegion(region)
      };
    });

    // Count quests by region using shop province
    activeQuests.forEach(quest => {
      if (quest.shop && quest.shop.province) {
        const province = quest.shop.province;
        const region = getRegionByProvince(province);
        
        if (region && stats[region]) {
          stats[region].activeQuests++;
        }
      }
    });

    // Count shops by region
    activeShops.forEach(shop => {
      if (shop.province) {
        const region = getRegionByProvince(shop.province);
        if (region && stats[region]) {
          stats[region].totalShops++;
        }
      }
    });

    // Calculate popular provinces for each region
    for (const region of Object.keys(provinceGroups)) {
      const provinces = getProvincesByRegion(region);
      const provinceQuestCounts = {};
      
      // Count quests for each province in this region
      activeQuests.forEach(quest => {
        if (quest.shop && quest.shop.province && provinces.includes(quest.shop.province)) {
          const province = quest.shop.province;
          provinceQuestCounts[province] = (provinceQuestCounts[province] || 0) + 1;
        }
      });

      // Sort provinces by quest count and get top 3
      const popularProvinces = Object.entries(provinceQuestCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 100)
        .map(([province]) => province);

      // If we have popular provinces from quests, use them
      if (popularProvinces.length > 0) {
        stats[region].popularProvinces = popularProvinces;
      } else {
        // Otherwise use the first 3 provinces from the region
        stats[region].popularProvinces = provinces.slice(0, 100);
      }

      console.log(`✅ ${region}: ${stats[region].activeQuests} quests, ${stats[region].totalShops} shops, popular: ${stats[region].popularProvinces.join(', ')}`);
    }

    res.json({ 
      success: true, 
      data: stats,
      message: 'Real region statistics from database using thaiProvinces.js data'
    });
  } catch (error) {
    console.error('❌ Error in region stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching region statistics',
      error: error.message 
    });
  }
});

// Get hot quests
router.get('/hot', async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    console.log('🔥 Fetching REAL hot quests from database');

    const hotQuests = await Quest.find({
      status: 'active',
      endDate: { $gte: new Date() }
    })
    .populate('shop', 'shopName province')
    .sort({ currentParticipants: -1, createdAt: -1 })
    .limit(parseInt(limit))
    .lean();

    // Transform the data for frontend
    const transformedQuests = hotQuests.map(quest => ({
      _id: quest._id,
      name: quest.name,
      description: quest.description,
      rewardAmount: quest.rewardAmount,
      rewardPoints: quest.rewardPoints,
      province: quest.shop?.province || 'กรุงเทพมหานคร',
      shopName: quest.shop?.shopName || 'ร้านค้า',
      currentParticipants: quest.currentParticipants || 0,
      maxParticipants: quest.maxParticipants || 10,
      category: quest.category || 'general',
      startDate: quest.startDate,
      endDate: quest.endDate,
      shop: quest.shop,
      region: getRegionByProvince(quest.shop?.province) || 'กลาง'
    }));

    console.log(`✅ Found ${transformedQuests.length} hot quests`);
    
    res.json({ 
      success: true, 
      data: transformedQuests,
      count: transformedQuests.length,
      message: 'Real hot quests data from database'
    });
  } catch (error) {
    console.error('❌ Error in hot quests:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching hot quests',
      error: error.message 
    });
  }
});

// Get active quests
router.get('/active', async (req, res) => {
  try {
    const { limit = 1000 } = req.query;
    console.log('🔄 Fetching REAL active quests from database');

    const activeQuests = await Quest.find({
      status: 'active',
      endDate: { $gte: new Date() }
    })
    .populate('shop', 'shopName province')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .lean();

    const transformedQuests = activeQuests.map(quest => ({
      _id: quest._id,
      name: quest.name,
      description: quest.description,
      rewardAmount: quest.rewardAmount,
      rewardPoints: quest.rewardPoints,
      province: quest.shop?.province || 'กรุงเทพมหานคร',
      shopName: quest.shop?.shopName || 'ร้านค้า',
      currentParticipants: quest.currentParticipants || 0,
      maxParticipants: quest.maxParticipants || 10,
      category: quest.category || 'general',
      type: quest.type,
      shopId: quest.shopId,
      startDate: quest.startDate,
      endDate: quest.endDate,
      shop: quest.shop,
      region: getRegionByProvince(quest.shop?.province) || 'กลาง'
    }));

    console.log(`✅ Found ${transformedQuests.length} active quests`);
    
    res.json({ 
      success: true, 
      data: transformedQuests,
      count: transformedQuests.length,
      message: 'Real active quests data from database'
    });
  } catch (error) {
    console.error('❌ Error in active quests:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching active quests',
      error: error.message 
    });
  }
});

// Get quests by region
router.get('/region/:region', async (req, res) => {
  try {
    const { region } = req.params;
    const { limit = 50 } = req.query;
    
    console.log(`🗺️ Fetching quests for region: ${region}`);

    const provinces = getProvincesByRegion(region);
    
    if (!provinces || provinces.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Region '${region}' not found`
      });
    }

    const regionQuests = await Quest.find({
      status: 'active',
      endDate: { $gte: new Date() }
    })
    .populate('shop', 'shopName province district images')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .lean();

    // Filter quests by province
    const filteredQuests = regionQuests.filter(quest => {
      const questProvince = quest.shop?.province;
      return questProvince && provinces.includes(questProvince);
    });

    const transformedQuests = filteredQuests.map(quest => ({
      _id: quest._id,
      name: quest.name,
      description: quest.description,
      rewardAmount: quest.rewardAmount,
      rewardPoints: quest.rewardPoints,
      province: quest.shop?.province,
      shopName: quest.shop?.shopName || 'ร้านค้า',
      shopInfo: quest.shop,
      currentParticipants: quest.currentParticipants || 0,
      maxParticipants: quest.maxParticipants || 10,
      category: quest.category || 'general',
      startDate: quest.startDate,
      endDate: quest.endDate
    }));

    console.log(`✅ Found ${transformedQuests.length} quests in region: ${region}`);
    
    res.json({
      success: true,
      data: transformedQuests,
      count: transformedQuests.length,
      region: region,
      provinces: provinces
    });

  } catch (error) {
    console.error('❌ Error fetching quests by region:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching quests by region',
      error: error.message
    });
  }
});

// GET unique check-in users count for a shop (must be before /shop/:shopId)
router.get('/shop/:shopId/check-in-users-count', async (req, res) => {
  try {
    const { shopId } = req.params;
    console.log('📊 Fetching unique check-in users count for shop:', shopId);

    // Find shop ObjectId
    let shopObjectId = null;
    try {
      const shop = await Shop.findOne({ 
        $or: [
          { shopId: shopId },
          { _id: shopId }
        ]
      }).select('_id');
      if (shop) {
        shopObjectId = shop._id;
      }
    } catch (shopError) {
      console.log('⚠️ Could not find shop ObjectId');
    }

    // Build query to find check-in quests for this shop
    const shopOrConditions = [{ shopId: shopId }];
    if (shopObjectId) {
      shopOrConditions.push({ shop: shopObjectId });
    } else if (mongoose.Types.ObjectId.isValid(shopId)) {
      shopOrConditions.push({ shop: new mongoose.Types.ObjectId(shopId) });
    }

    const query = {
      status: 'active',
      $and: [
        { $or: shopOrConditions },
        {
          $or: [
            { type: 'location_checkin' },
            { category: 'check-in' }
          ]
        }
      ]
    };

    // Find all check-in quests for this shop
    const checkInQuests = await Quest.find(query).select('_id').lean();
    const checkInQuestIds = checkInQuests.map(q => q._id);

    if (checkInQuestIds.length === 0) {
      return res.json({
        success: true,
        count: 0
      });
    }

    // Count unique users who completed any check-in quest for this shop
    const uniqueUsers = await UserQuest.distinct('userId', {
      questId: { $in: checkInQuestIds },
      status: 'completed'
    });

    console.log(`✅ Found ${uniqueUsers.length} unique users who checked in at shop ${shopId}`);

    res.json({
      success: true,
      count: uniqueUsers.length
    });

  } catch (error) {
    console.error('❌ Error fetching unique check-in users count:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching unique check-in users count',
      error: error.message
    });
  }
});

// Get quests by shop ID
router.get('/shop/:shopId', async (req, res) => {
  try {
    const { shopId } = req.params;
    console.log('🏪 Fetching quests for shop:', shopId);

    // Query by both shopId (String) and shop (ObjectId) to find all quests
    let shopObjectId = null;
    
    // Try to find shop by shopId to get ObjectId
    try {
      const shop = await Shop.findOne({ 
        $or: [
          { shopId: shopId },
          { _id: shopId }
        ]
      }).select('_id');
      if (shop) {
        shopObjectId = shop._id;
      }
    } catch (shopError) {
      console.log('⚠️ Could not find shop ObjectId, will query by shopId only');
    }

    // Check if shopId is a valid ObjectId
    let isValidObjectId = false;
    try {
      if (mongoose.Types.ObjectId.isValid(shopId)) {
        isValidObjectId = true;
      }
    } catch (e) {
      isValidObjectId = false;
    }

    // Build query to match either shopId string or shop ObjectId
    const query = {
      status: 'active',
      endDate: { $gte: new Date() }
    };
    
    // Build $or conditions
    const orConditions = [{ shopId: shopId }];
    
    // Only add shop ObjectId condition if we have a valid ObjectId
    if (shopObjectId) {
      orConditions.push({ shop: shopObjectId });
    } else if (isValidObjectId) {
      // Only try to use shopId as ObjectId if it's a valid ObjectId format
      orConditions.push({ shop: new mongoose.Types.ObjectId(shopId) });
    }
    
    query.$or = orConditions;

    const quests = await Quest.find(query)
    .populate('shop', 'shopName province district')
    .sort({ createdAt: -1 })
    .lean();
    
    console.log(`✅ Found ${quests.length} quests for shop ${shopId} (ObjectId: ${shopObjectId})`);
    
    // Convert requiredData Map to object for each quest
    const transformedQuests = quests.map(quest => {
      // Convert requiredData Map to plain object if it exists
      let requiredDataObj = {};
      if (quest.requiredData) {
        try {
          if (quest.requiredData instanceof Map || quest.requiredData.constructor?.name === 'Map') {
            requiredDataObj = Object.fromEntries(quest.requiredData);
          } else if (quest.requiredData && typeof quest.requiredData === 'object') {
            requiredDataObj = quest.requiredData;
          }
        } catch (error) {
          console.error('Error converting requiredData for quest:', quest._id, error);
          requiredDataObj = {};
        }
      }

      return {
        _id: quest._id,
        name: quest.name,
        description: quest.description,
        instructions: quest.instructions,
        rewardAmount: quest.rewardAmount,
        rewardPoints: quest.rewardPoints,
        category: quest.category,
        type: quest.type,
        shopId: quest.shopId,
        coordinates: quest.coordinates,
        locationName: quest.locationName,
        address: quest.address,
        difficulty: quest.difficulty,
        status: quest.status,
        startDate: quest.startDate,
        endDate: quest.endDate,
        currentParticipants: quest.currentParticipants,
        maxParticipants: quest.maxParticipants,
        verificationType: quest.verificationMethod || quest.verificationType,
        requirements: quest.requirements || [],
        requiredData: requiredDataObj // Include requiredData in response
      };
    });

    res.json({
      success: true,
      data: transformedQuests,
      count: transformedQuests.length
    });

  } catch (error) {
    console.error('❌ Error fetching shop quests:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching shop quests',
      error: error.message
    });
  }
});

// CREATE QUEST FROM TEMPLATE ROUTE - WITH ALL IMPORTS
router.post('/from-template', auth, async (req, res) => {
  try {
    console.log('📥 Creating quest from template:', req.body);
    console.log('👤 User:', req.user.email);
    
    const { templateId, shopId, budget, maxParticipants, duration } = req.body;
    
    // Validate input
    if (!templateId || !shopId || !budget || !maxParticipants) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Get the template
    const template = await QuestTemplate.findById(templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Quest template not found'
      });
    }

    console.log('📋 Template found:', template.name, 'Type:', template.type);

    // Get the shop by shopId
    const shop = await Shop.findOne({ shopId: shopId });
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: `Shop not found with ID: ${shopId}`
      });
    }

    console.log('🏪 Shop found:', shop.shopName, 'Owner:', shop.ownerEmail);

    // Check if user has permission
    const isShopOwner = shop.ownerEmail === req.user.email;
    const isAdmin = req.user.userType === 'admin';
    
    if (!isShopOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: `You do not have permission to create quests for this shop. Shop owner: ${shop.ownerEmail}, Your email: ${req.user.email}`
      });
    }

    // Calculate reward per user
    const rewardPerUser = budget / maxParticipants;
    
    // Extract requiredData from template
    let requiredData = {};
    if (template.requiredData) {
      // Handle both Map and object formats
      if (template.requiredData instanceof Map) {
        requiredData = Object.fromEntries(template.requiredData);
      } else if (typeof template.requiredData === 'object') {
        requiredData = template.requiredData;
      }
    }
    
    console.log('📦 Template requiredData:', requiredData);

    // Create quest data from template
    const questData = {
      name: template.name,
      description: template.description,
      template: templateId,
      shopId: shopId,
      shop: shop._id,
      budget: parseFloat(budget),
      rewardAmount: parseFloat(rewardPerUser.toFixed(2)),
      rewardPoints: template.rewardPoints || 10,
      maxParticipants: parseInt(maxParticipants),
      currentParticipants: 0,
      duration: parseInt(duration) || 7,
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + (parseInt(duration) || 7) * 24 * 60 * 60 * 1000),
      totalSpent: 0,
      qrCode: `QR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      submissions: [],
      isActive: true,
      isDeleted: false,
      createdBy: req.user._id,
      
      // Copy template-specific data
      type: template.type,
      verificationMethod: template.verificationMethod,
      instructions: template.instructions,
      category: template.category,
      estimatedTime: template.estimatedTime,
      tags: template.tags || [],
      requiredData: requiredData,
    };

    // Add Facebook-specific fields if this is a Facebook template
    if (template.type === 'facebook_follow' && requiredData) {
      questData.facebookPageId = requiredData.facebookPageId;
      questData.facebookPageName = requiredData.facebookPageName;
      questData.facebookPageUrl = requiredData.facebookPageUrl;
    }
    
    // Add Location-specific fields if this is a Location template
    if (template.type === 'location_checkin' && requiredData) {
      questData.locationName = requiredData.locationName;
      questData.address = requiredData.address;
      questData.coordinates = requiredData.coordinates;
      questData.radius = requiredData.radius || 100;
    }

    console.log('📦 Final quest data:', JSON.stringify(questData, null, 2));

    // Create the quest
    const quest = new Quest(questData);
    await quest.save();

    // Populate related data
    const populatedQuest = await Quest.findById(quest._id)
      .populate('shop', 'shopName province district address phone')
      .populate('createdBy', 'name email')
      .populate('template', 'name type verificationMethod requiredData');

    // Increment template usage count
    template.usageCount = (template.usageCount || 0) + 1;
    template.lastUsedAt = new Date();
    await template.save();

    // Update shop's active quests count
    shop.activeQuests = (shop.activeQuests || 0) + 1;
    await shop.save();

    console.log('✅ Quest created successfully!');

    res.status(201).json({
      success: true,
      message: 'Quest created successfully',
      data: populatedQuest
    });

  } catch (error) {
    console.error('❌ Error creating quest:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Add a test route to verify QuestTemplate is working
router.get('/test-template/:id', auth, async (req, res) => {
  try {
    const template = await QuestTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    
    res.json({
      success: true,
      template: template
    });
  } catch (error) {
    console.error('Test template error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching template'
    });
  }
});

// Participate in a quest
router.post('/:questId/participate', auth, async (req, res) => {
  try {
    const { questId } = req.params;
    const { userId } = req.body;

    const quest = await Quest.findById(questId);
    if (!quest) {
      return res.status(404).json({
        success: false,
        message: 'Quest not found'
      });
    }

    // Check if quest is active
    if (quest.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Quest is not active'
      });
    }

    // Check if quest has slots available
    if (quest.currentParticipants >= quest.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: 'Quest is full'
      });
    }

    // Check if user already participating
    try {
      const isCheckInQuest = quest.type === 'location_checkin' || quest.category === 'check-in';
      let existingParticipation = null;

      if (isCheckInQuest) {
        // For check-in quests, check if user completed it today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayCompletion = await UserQuest.findOne({
          userId: userId,
          questId: questId,
          status: 'completed',
          completedAt: {
            $gte: today,
            $lt: tomorrow
          }
        });

        if (todayCompletion) {
          return res.status(400).json({
            success: false,
            message: 'คุณทำเควสเช็คอินนี้แล้ววันนี้ (ทำได้วันละครั้ง)'
          });
        }

        // Check if user is currently participating (in_progress or pending) - not completed today
        existingParticipation = await UserQuest.findOne({
          userId: userId,
          questId: questId,
          status: { $ne: 'completed' } // Allow participation if not completed, or completed before today
        });
      } else {
        // For non-check-in quests, check if user is already participating
        existingParticipation = await UserQuest.findOne({
          userId: userId,
          questId: questId
        });
      }

      if (existingParticipation) {
        return res.status(400).json({
          success: false,
          message: 'Already participating in this quest'
        });
      }
    } catch (participationCheckError) {
      console.error('Error checking existing participation:', participationCheckError);
      throw participationCheckError;
    }

    // Get shopId from quest (can be string shopId or ObjectId shop)
    let questShopId = null;
    if (quest.shopId) {
      questShopId = quest.shopId.toString();
    } else if (quest.shop?._id) {
      questShopId = quest.shop._id.toString();
    } else if (quest.shop) {
      questShopId = quest.shop.toString();
    }
    
    // If still no shopId, try to get from shop reference
    if (!questShopId && quest.shop) {
      try {
        const Shop = require('../models/Shop');
        const shopDoc = await Shop.findById(quest.shop).select('_id shopId').lean();
        if (shopDoc) {
          questShopId = shopDoc.shopId || shopDoc._id.toString();
        }
      } catch (shopError) {
        console.error('Error fetching shop for shopId:', shopError);
      }
    }
    
    // Ensure shopId is not null (required field)
    if (!questShopId) {
      console.error('❌ No shopId found for quest:', quest._id);
      return res.status(400).json({
        success: false,
        message: 'Quest missing shop information'
      });
    }
    
    // Get reward values with defaults - ensure they are numbers, not undefined
    const questRewardPoints = (quest.rewardPoints !== undefined && quest.rewardPoints !== null) 
      ? Number(quest.rewardPoints) 
      : 0;
    const questRewardAmount = (quest.rewardAmount !== undefined && quest.rewardAmount !== null) 
      ? Number(quest.rewardAmount) 
      : 0;
    const questName = quest.name || quest.title || 'Quest';
    
    console.log('📋 Participation - Quest data:', {
      questId: quest._id,
      questName: questName,
      shopId: questShopId,
      rewardPoints: questRewardPoints,
      rewardAmount: questRewardAmount
    });
    
    // Create participation record
    // Use findOneAndUpdate with upsert to avoid duplicate key errors
    let userQuest = await UserQuest.findOne({
      userId: userId,
      questId: questId
    });

    if (userQuest) {
      // For check-in quests, check if completed today (resets after midnight)
      const isCheckInQuest = quest.type === 'location_checkin' || quest.category === 'check-in';
      
      if (isCheckInQuest && userQuest.status === 'completed') {
        // Check if completed today (for daily reset after midnight)
        // Use UTC dates to match frontend and complete endpoint logic
        const now = new Date();
        const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
        const tomorrowUTC = new Date(todayUTC);
        tomorrowUTC.setUTCDate(tomorrowUTC.getUTCDate() + 1);
        
        const completedAt = userQuest.completedAt ? new Date(userQuest.completedAt) : null;
        
        if (completedAt && completedAt >= todayUTC && completedAt < tomorrowUTC) {
          // Completed today - cannot participate again
          return res.status(400).json({
            success: false,
            message: 'คุณทำเควสเช็คอินนี้แล้ววันนี้ (ทำได้วันละครั้ง)'
          });
        } else {
          // Completed before today - quest has reset, allow participation
          // Delete old UserQuest to allow new participation
          console.log(`🔄 Daily quest reset: User completed quest on ${completedAt?.toISOString()}, todayUTC=${todayUTC.toISOString()}, allowing new participation`);
          await UserQuest.deleteOne({ _id: userQuest._id });
          userQuest = null; // Reset to allow creating new participation
        }
      } else if (userQuest.status === 'completed') {
        // Non-check-in quest already completed - cannot participate again
        return res.status(400).json({
          success: false,
          message: 'Quest already completed'
        });
      } else {
        // Already participating but not completed
        return res.status(400).json({
          success: false,
          message: 'Already participating in this quest'
        });
      }
    }

    // Create new participation record
    userQuest = new UserQuest({
      userId: userId,
      questId: questId,
      questName: questName,
      shopId: questShopId,
      rewardAmount: questRewardAmount,
      rewardPoints: questRewardPoints,
      status: 'participating',
      joinedAt: new Date()
    });

    try {
      await userQuest.save();
    } catch (saveError) {
      // Handle duplicate key error (race condition)
      if (saveError.code === 11000 || saveError.name === 'MongoServerError') {
        console.log('⚠️ Duplicate key error - user already participating (race condition)');
        return res.status(400).json({
          success: false,
          message: 'Already participating in this quest'
        });
      }
      throw saveError; // Re-throw if it's a different error
    }

    // Update quest participant count (only if not already updated)
    if (quest.currentParticipants < quest.maxParticipants) {
      quest.currentParticipants += 1;
      await quest.save();
    }

    res.json({
      success: true,
      message: 'Successfully joined quest',
      data: userQuest
    });

  } catch (error) {
    console.error('Error participating in quest:', error);
    console.error('Error stack:', error.stack);
    
    // Handle duplicate key error specifically
    if (error.code === 11000 || (error.name === 'MongoServerError' && error.message?.includes('duplicate key'))) {
      console.log('⚠️ Duplicate key error - user already participating');
      return res.status(400).json({
        success: false,
        message: 'Already participating in this quest'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Complete a quest (verify and claim reward)
// Location verification endpoint for check-in quests
router.post('/:questId/verify-location', auth, async (req, res) => {
  try {
    const { questId } = req.params;
    const { latitude, longitude } = req.body;

    // Validate input
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing coordinates. Please provide latitude and longitude.'
      });
    }

    // Get quest
    const quest = await Quest.findById(questId);
    if (!quest) {
      return res.status(404).json({
        success: false,
        message: 'Quest not found'
      });
    }

    // Check if quest is location_checkin type
    if (quest.type !== 'location_checkin') {
      return res.status(400).json({
        success: false,
        message: 'This quest is not a location check-in quest'
      });
    }

    // Check if quest has location data
    if (!quest.coordinates || !quest.radius) {
      return res.status(400).json({
        success: false,
        message: 'Quest location data is missing'
      });
    }

    // Parse target coordinates (quest.coordinates is stored as string "lat,lng")
    const locationVerificationService = require('../service/locationVerificationService');
    
    const userCoordinates = { latitude: parseFloat(latitude), longitude: parseFloat(longitude) };
    let targetCoordinates;
    
    if (typeof quest.coordinates === 'string') {
      const [lat, lng] = quest.coordinates.split(',').map(Number);
      targetCoordinates = { latitude: lat, longitude: lng };
    } else if (quest.coordinates.latitude && quest.coordinates.longitude) {
      targetCoordinates = quest.coordinates;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid quest coordinates format'
      });
    }

    // Verify location
    const verificationResult = await locationVerificationService.verifyLocation(
      userCoordinates,
      targetCoordinates,
      quest.radius
    );

    res.json({
      success: true,
      verified: verificationResult.isValid,
      distance: verificationResult.distance,
      radius: verificationResult.radius,
      withinRadius: verificationResult.withinRadius,
      message: verificationResult.isValid 
        ? `คุณอยู่ในระยะการเช็คอิน (ระยะห่าง: ${verificationResult.distance.toFixed(0)} เมตร)`
        : `คุณอยู่ห่างจากสถานที่ ${verificationResult.distance.toFixed(0)} เมตร กรุณาเข้าใกล้สถานที่มากขึ้น (รัศมี: ${quest.radius} เมตร)`
    });

  } catch (error) {
    console.error('Error verifying location:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying location',
      error: error.message
    });
  }
});

router.post('/:questId/complete', auth, async (req, res) => {
  try {
    const { questId } = req.params;
    const { userId, verificationData, latitude, longitude } = req.body;

    const quest = await Quest.findById(questId);
    if (!quest) {
      return res.status(404).json({
        success: false,
        message: 'Quest not found'
      });
    }

    // For location_checkin quests, verify location first
    if (quest.type === 'location_checkin') {
      if (latitude === undefined || longitude === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Missing coordinates. Please provide latitude and longitude for location check-in quest.'
        });
      }

      const locationVerificationService = require('../service/locationVerificationService');
      
      const userCoordinates = { latitude: parseFloat(latitude), longitude: parseFloat(longitude) };
      let targetCoordinates;
      
      if (typeof quest.coordinates === 'string') {
        const [lat, lng] = quest.coordinates.split(',').map(Number);
        targetCoordinates = { latitude: lat, longitude: lng };
      } else if (quest.coordinates.latitude && quest.coordinates.longitude) {
        targetCoordinates = quest.coordinates;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid quest coordinates format'
        });
      }

      const verificationResult = await locationVerificationService.verifyLocation(
        userCoordinates,
        targetCoordinates,
        quest.radius
      );

      if (!verificationResult.isValid) {
        return res.status(400).json({
          success: false,
          message: `คุณอยู่ห่างจากสถานที่ ${verificationResult.distance.toFixed(0)} เมตร กรุณาเข้าใกล้สถานที่มากขึ้น (รัศมี: ${quest.radius} เมตร)`,
          distance: verificationResult.distance,
          radius: verificationResult.radius
        });
      }
    }

    // Find user's participation
    const UserQuest = require('../models/UserQuest');
    const userQuest = await UserQuest.findOne({
      userId: userId,
      questId: questId
    });

    if (!userQuest) {
      return res.status(404).json({
        success: false,
        message: 'Not participating in this quest'
      });
    }

    // For check-in quests, check if user already completed today (once per day per shop)
    const isCheckInQuest = quest.type === 'location_checkin' || quest.category === 'check-in';
    console.log(`🔍 Complete quest - isCheckInQuest: ${isCheckInQuest}, quest.shopId: ${quest.shopId}, quest._id: ${quest._id}, questId: ${questId}`);
    if (isCheckInQuest) {
      // Check if user completed this quest today
      // Use UTC dates to match frontend and participate endpoint logic
      const now = new Date();
      const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
      const tomorrowUTC = new Date(todayUTC);
      tomorrowUTC.setUTCDate(tomorrowUTC.getUTCDate() + 1);

      const todayCompletion = await UserQuest.findOne({
        userId: userId,
        questId: questId,
        status: 'completed',
        completedAt: {
          $gte: todayUTC,
          $lt: tomorrowUTC
        }
      });

      if (todayCompletion) {
        return res.status(400).json({
          success: false,
          message: 'คุณทำเควสเช็คอินนี้แล้ววันนี้ (ทำได้วันละครั้ง)'
        });
      }
    }

    // For non-check-in quests, prevent duplicate completion
    // Check-in quests are handled above (can be done once per day)
    if (!isCheckInQuest && userQuest.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Quest already completed'
      });
    }

    // Get reward points - use admin settings for check-in quests
    let rewardPoints = quest.rewardPoints || 0;
    let rewardAmount = quest.rewardAmount || 0;
    
    if (quest.type === 'location_checkin' || quest.category === 'check-in') {
      // Get check-in points from admin settings - prioritize daily_checkin_points (คะแนน Check-in รายวัน)
      let checkInPoints = await QuestSettings.getSetting('daily_checkin_points');
      if (checkInPoints === null || checkInPoints === undefined) {
        checkInPoints = await QuestSettings.getSetting('shop_checkin_points');
      }
      // Handle 0 as valid value (not falsy)
      if (checkInPoints === null || checkInPoints === undefined) {
        checkInPoints = 10; // Default fallback
      }
      // Convert to number if string
      rewardPoints = typeof checkInPoints === 'string' ? parseFloat(checkInPoints) : Number(checkInPoints);
      if (isNaN(rewardPoints)) {
        rewardPoints = 10; // Fallback if not a valid number
      }
      console.log(`✅ Check-in quest: Using ${rewardPoints} points from admin settings (daily_checkin_points)`);
    }

    // Update quest completion
    userQuest.status = 'completed';
    userQuest.verifiedAt = new Date();
    userQuest.verificationData = verificationData || { latitude, longitude };
    userQuest.completedAt = new Date();
    await userQuest.save();

    // Update quest spending
    quest.totalSpent += rewardAmount;
    await quest.save();

    // Add to user's submissions
    await Quest.findByIdAndUpdate(questId, {
      $push: {
        submissions: {
          userId: userId,
          verifiedAt: new Date(),
          rewardAmount: rewardAmount,
          rewardPoints: rewardPoints
        }
      }
    });

    // Add points to user account and update shop check-in stats
    let user = null;
    if (rewardPoints > 0 || isCheckInQuest) {
      user = await User.findById(userId);
      if (user) {
        // Add points
        if (rewardPoints > 0) {
          user.points = (user.points || 0) + rewardPoints;
        }
        
        // Update shop check-in stats for check-in quests
        if (isCheckInQuest && quest.shopId) {
          const shopIdStr = quest.shopId.toString();
          const currentCount = user.shopCheckInStats?.get(shopIdStr) || 0;
          if (!user.shopCheckInStats) {
            user.shopCheckInStats = new Map();
          }
          user.shopCheckInStats.set(shopIdStr, currentCount + 1);
          console.log(`📊 Updated shop check-in stat: User ${userId} -> Shop ${shopIdStr} = ${currentCount + 1} times`);
          console.log(`📊 Shop check-in stats after update:`, {
            shopIdStr: shopIdStr,
            currentCount: currentCount + 1,
            allStats: user.shopCheckInStats ? Object.fromEntries(user.shopCheckInStats) : null
          });
        } else if (isCheckInQuest && !quest.shopId) {
          console.log(`⚠️ Check-in quest ${quest._id} has no shopId - cannot update shopCheckInStats`);
        }
        
        await user.save();

        // Create PointTransaction record for point history
        if (rewardPoints > 0) {
          try {
            let shopName = 'ร้านค้า';
            
            // Try to get shop name - handle both ObjectId and string shopId
            if (quest.shopId) {
              try {
                // Check if shopId is a valid ObjectId
                if (mongoose.Types.ObjectId.isValid(quest.shopId)) {
                  const shop = await Shop.findById(quest.shopId).select('shopName').lean();
                  if (shop) {
                    shopName = shop.shopName || 'ร้านค้า';
                  }
                } else {
                  // If not a valid ObjectId, try finding by shopId field
                  const shop = await Shop.findOne({ shopId: quest.shopId }).select('shopName').lean();
                  if (shop) {
                    shopName = shop.shopName || 'ร้านค้า';
                  }
                }
              } catch (shopError) {
                // If shop lookup fails, use default name
                console.log(`ℹ️ Could not fetch shop name for shopId: ${quest.shopId}`);
              }
            }
            
            await PointTransaction.create({
              userId: userId,
              type: isCheckInQuest ? 'reward' : 'reward', // Use 'reward' for quest completion
              amount: rewardPoints,
              description: isCheckInQuest 
                ? `เช็คอินที่ ${shopName}` 
                : `ทำเควส: ${quest.name}`,
              questId: questId,
              remainingPoints: user.points,
              status: 'completed'
            });
            
            console.log(`💰 Point transaction created: ${rewardPoints} points for ${isCheckInQuest ? 'check-in' : 'quest'} completion`);
          } catch (pointTxError) {
            // Don't fail quest completion if point transaction creation fails
            console.error('⚠️ Error creating point transaction:', pointTxError);
          }
        }
      }
    }

    // Auto-create coupon for first check-in quest of the day
    let autoCoupon = null;
    if ((quest.type === 'location_checkin' || quest.category === 'check-in') && user) {
      try {
        const autoCouponEnabled = await QuestSettings.getSetting('auto_coupon_on_checkin');
        const quest50Enabled = await QuestSettings.getSetting('daily_quest_50_points_enabled');
        
        if (autoCouponEnabled && quest50Enabled) {
          // Check if this is the first check-in quest completed today
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);

          // Check if any other check-in quests were completed today
          const otherCheckInQuests = await UserQuest.find({
            userId: userId,
            status: 'completed',
            completedAt: {
              $gte: today,
              $lt: tomorrow
            },
            questId: { $ne: questId }
          }).populate('questId', 'category type');

          const hasOtherCheckInToday = otherCheckInQuests.some(uq => {
            const q = uq.questId;
            return q && (q.category === 'check-in' || q.type === 'location_checkin');
          });

          // Only create coupon if this is the first check-in quest of the day
          if (!hasOtherCheckInToday) {
            const discountValue = await QuestSettings.getSetting('daily_quest_50_points_discount') || 5;
            const expiryDays = await QuestSettings.getSetting('coupon_expiry_days') || 1;
            const shopId = quest.shopId || quest.shop?._id || quest.shop;

            if (shopId) {
              const Coupon = require('../models/Coupon');
              
              // Generate coupon code
              let couponCode;
              let isUnique = false;
              let attempts = 0;
              while (!isUnique && attempts < 10) {
                couponCode = Coupon.generateCode('AUTO');
                const existing = await Coupon.findOne({ code: couponCode });
                if (!existing) {
                  isUnique = true;
                }
                attempts++;
              }

              if (isUnique) {
                // Calculate expiry date
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + expiryDays);
                expiresAt.setHours(23, 59, 59, 999);

                // Create coupon
                autoCoupon = new Coupon({
                  code: couponCode,
                  discountType: 'percentage',
                  discountValue: discountValue,
                  userId: userId,
                  shopId: shopId,
                  expiresAt: expiresAt
                });

                await autoCoupon.save();
                console.log(`✅ Auto-created coupon ${couponCode} for user ${userId} after check-in quest`);
              }
            }
          }
        }
      } catch (couponError) {
        console.error('Error creating auto coupon:', couponError);
        // Don't fail the quest completion if coupon creation fails
      }
    }

    res.json({
      success: true,
      message: 'Quest completed successfully',
      data: {
        rewardAmount: rewardAmount,
        rewardPoints: rewardPoints,
        completedAt: userQuest.completedAt,
        autoCoupon: autoCoupon ? {
          code: autoCoupon.code,
          discountValue: autoCoupon.discountValue,
          expiresAt: autoCoupon.expiresAt
        } : null
      }
    });

  } catch (error) {
    console.error('Error completing quest:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user's quests
router.get('/users/:userId/quests', auth, async (req, res) => {
  try {
    const { userId } = req.params;

    const userQuests = await UserQuest.find({ userId: userId })
      .sort({ joinedAt: -1 });

    res.json({
      success: true,
      data: userQuests
    });

  } catch (error) {
    console.error('Error fetching user quests:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get quest by id (used by QuestDetails / ShopQuestDetail)
// NOTE: Keep this route LAST to avoid shadowing other routes like /users/:userId/quests
// Get single quest by ID
router.get('/:questId', async (req, res) => {
  try {
    const { questId } = req.params;

    const quest = await Quest.findById(questId)
      .populate('shop', 'shopName shopType province district address coordinates images phone description status shopId')
      .lean();

    if (!quest) {
      return res.status(404).json({
        success: false,
        message: 'Quest not found'
      });
    }

    // Convert requiredData Map to plain object if it exists
    // MongoDB Maps need to be converted to objects for JSON response
    let requiredDataObj = {};
    if (quest.requiredData) {
      try {
        // Check if it's a Map (Mongoose Map type)
        if (quest.requiredData instanceof Map || quest.requiredData.constructor?.name === 'Map') {
          // Convert Map to plain object
          requiredDataObj = Object.fromEntries(quest.requiredData);
          console.log('🔄 Converted requiredData Map to object:', requiredDataObj);
        } else if (quest.requiredData && typeof quest.requiredData === 'object') {
          // Already an object (from .lean() or direct assignment)
          requiredDataObj = quest.requiredData;
        } else {
          // Fallback: try to use as-is
          requiredDataObj = quest.requiredData;
        }
      } catch (error) {
        console.error('❌ Error converting requiredData:', error);
        requiredDataObj = {};
      }
    }

    // Log quest data for debugging (especially requiredData)
    console.log('📋 Quest data for GET /:questId:', {
      questId: quest._id,
      type: quest.type,
      hasRequiredData: !!quest.requiredData,
      requiredDataType: typeof quest.requiredData,
      requiredDataConstructor: quest.requiredData?.constructor?.name,
      requiredDataObj: requiredDataObj,
      menuItems: requiredDataObj?.menuItems,
      menuItemsLength: Array.isArray(requiredDataObj?.menuItems) ? requiredDataObj.menuItems.length : 0
    });

    // Ensure radius exists for location_checkin quests (default 100m)
    if (quest.type === 'location_checkin' && !quest.radius) {
      quest.radius = 100;
    }

    // Build response with converted requiredData
    const questResponse = {
      ...quest,
      requiredData: requiredDataObj
    };

    return res.json({
      success: true,
      data: questResponse
    });
  } catch (error) {
    console.error('❌ Error fetching quest by id:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching quest',
      error: error.message
    });
  }
});

// Submit review for product_review quest
router.post('/:questId/review', auth, async (req, res) => {
  try {
    const { questId } = req.params;
    const { userId, reviews } = req.body;

    if (!userId || !reviews || !Array.isArray(reviews) || reviews.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, reviews (array)'
      });
    }

    const quest = await Quest.findById(questId)
      .populate('shop', '_id shopId');
    if (!quest) {
      return res.status(404).json({
        success: false,
        message: 'Quest not found'
      });
    }

    // Verify it's a review quest
    if (quest.type !== 'product_review') {
      return res.status(400).json({
        success: false,
        message: 'This quest is not a review quest'
      });
    }

    // Get shopId from quest (can be string shopId or ObjectId shop)
    // Try multiple sources to get shopId
    let questShopId = null;
    if (quest.shopId) {
      questShopId = quest.shopId.toString();
    } else if (quest.shop?._id) {
      questShopId = quest.shop._id.toString();
    } else if (quest.shop) {
      questShopId = quest.shop.toString();
    }
    
    // If still no shopId, try to get from shop reference
    if (!questShopId && quest.shop) {
      try {
        const Shop = require('../models/Shop');
        const shopDoc = await Shop.findById(quest.shop).select('_id shopId').lean();
        if (shopDoc) {
          questShopId = shopDoc.shopId || shopDoc._id.toString();
        }
      } catch (shopError) {
        console.error('Error fetching shop for shopId:', shopError);
      }
    }
    
    // Ensure shopId is not null (required field)
    if (!questShopId) {
      console.error('❌ No shopId found for quest:', quest._id);
      return res.status(400).json({
        success: false,
        message: 'Quest missing shop information'
      });
    }
    
    // Get reward values with defaults - ensure they are numbers, not undefined
    const questRewardPoints = (quest.rewardPoints !== undefined && quest.rewardPoints !== null) 
      ? Number(quest.rewardPoints) 
      : 0;
    const questRewardAmount = (quest.rewardAmount !== undefined && quest.rewardAmount !== null) 
      ? Number(quest.rewardAmount) 
      : 0;
    const questName = quest.name || quest.title || 'Review Quest';
    
    console.log('📋 Review submission - Quest data:', {
      questId: quest._id,
      questName: questName,
      shopId: questShopId,
      rewardPoints: questRewardPoints,
      rewardAmount: questRewardAmount,
      questShop: quest.shop,
      questShopIdField: quest.shopId,
      questNameField: quest.name,
      questTitleField: quest.title,
      questRaw: {
        name: quest.name,
        title: quest.title,
        shopId: quest.shopId,
        rewardPoints: quest.rewardPoints,
        rewardAmount: quest.rewardAmount
      }
    });

    // Check if user already completed this quest
    const UserQuest = require('../models/UserQuest');
    const existingUserQuest = await UserQuest.findOne({
      userId: userId,
      questId: questId,
      status: 'completed'
    });

    if (existingUserQuest) {
      return res.status(400).json({
        success: false,
        message: 'คุณทำเควสนี้แล้ว'
      });
    }

    // Check quest limit
    if (quest.currentParticipants >= quest.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: 'เควสนี้เต็มแล้ว'
      });
    }

    // Create or update participation
    let userQuest = await UserQuest.findOne({
      userId: userId,
      questId: questId
    });

    if (!userQuest) {
      // Create new UserQuest with all required fields
      console.log('🆕 Creating new UserQuest with:', {
        userId,
        questId,
        questName: questName,
        shopId: questShopId,
        rewardAmount: questRewardAmount,
        rewardPoints: questRewardPoints
      });
      
      userQuest = new UserQuest({
        userId: userId,
        questId: questId,
        questName: questName,
        shopId: questShopId,
        rewardAmount: questRewardAmount,
        rewardPoints: questRewardPoints,
        status: 'pending',
        joinedAt: new Date()
      });
    } else {
      // Update existing UserQuest with required fields if missing
      console.log('🔄 Updating existing UserQuest:', {
        currentQuestName: userQuest.questName,
        currentShopId: userQuest.shopId,
        currentRewardAmount: userQuest.rewardAmount,
        currentRewardPoints: userQuest.rewardPoints
      });
      
      if (!userQuest.questName) userQuest.questName = questName;
      if (!userQuest.shopId) userQuest.shopId = questShopId;
      if (userQuest.rewardAmount === undefined || userQuest.rewardAmount === null) {
        userQuest.rewardAmount = questRewardAmount;
      }
      if (userQuest.rewardPoints === undefined || userQuest.rewardPoints === null) {
        userQuest.rewardPoints = questRewardPoints;
      }
      
      console.log('✅ Updated UserQuest:', {
        questName: userQuest.questName,
        shopId: userQuest.shopId,
        rewardAmount: userQuest.rewardAmount,
        rewardPoints: userQuest.rewardPoints
      });
    }

    // Store reviews in submission data
    // Convert to Map format for MongoDB
    if (!userQuest.submissionData) {
      userQuest.submissionData = new Map();
    }
    userQuest.submissionData.set('reviews', reviews);
    userQuest.submissionData.set('submittedAt', new Date());
    userQuest.status = 'completed';
    userQuest.completedAt = new Date();
    userQuest.verified = true;

    await userQuest.save();

    // Update quest participants count
    quest.currentParticipants += 1;
    await quest.save();

    // Award points to user
    const User = require('../models/User');
    const user = await User.findById(userId);
    if (user) {
      const pointsToAdd = quest.rewardPoints || 0;
      user.points = (user.points || 0) + pointsToAdd;
      await user.save();

      // Create PointTransaction record for point history
      if (pointsToAdd > 0) {
        try {
          let shopName = 'ร้านค้า';
          
          // Try to get shop name - handle both ObjectId and string shopId
          if (questShopId) {
            try {
              const Shop = require('../models/Shop');
              // Check if shopId is a valid ObjectId
              if (mongoose.Types.ObjectId.isValid(questShopId)) {
                const shop = await Shop.findById(questShopId).select('shopName').lean();
                if (shop) {
                  shopName = shop.shopName || 'ร้านค้า';
                }
              } else {
                // If not a valid ObjectId, try finding by shopId field
                const shop = await Shop.findOne({ shopId: questShopId }).select('shopName').lean();
                if (shop) {
                  shopName = shop.shopName || 'ร้านค้า';
                }
              }
            } catch (shopError) {
              // If shop lookup fails, use default name
              console.log(`ℹ️ Could not fetch shop name for shopId: ${questShopId}`);
            }
          }
          
          await PointTransaction.create({
            userId: userId,
            type: 'reward',
            amount: pointsToAdd,
            description: `รีวิวเมนูที่ ${shopName}`,
            questId: questId,
            remainingPoints: user.points,
            status: 'completed'
          });
          
          console.log(`💰 Point transaction created: ${pointsToAdd} points for review quest completion`);
        } catch (pointTxError) {
          // Don't fail quest completion if point transaction creation fails
          console.error('❌ Error creating point transaction for review quest:', pointTxError);
        }
      }
    }

    console.log('✅ Review quest completed:', {
      questId: questId,
      userId: userId,
      reviewsCount: reviews.length,
      pointsAwarded: quest.rewardPoints
    });

    res.json({
      success: true,
      message: 'รีวิวถูกส่งเรียบร้อยแล้ว',
      data: {
        questId: quest._id,
        pointsReceived: quest.rewardPoints || 0,
        reviewsSubmitted: reviews.length
      }
    });
  } catch (error) {
    console.error('❌ Review submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get reviews for a specific menu item in a quest
// PUBLIC ENDPOINT - Anyone can view reviews (no authentication required)
router.get('/:questId/reviews', async (req, res) => {
  try {
    const { questId } = req.params;
    const { menuItemId } = req.query;

    if (!menuItemId) {
      return res.status(400).json({
        success: false,
        message: 'menuItemId is required'
      });
    }

    // First, check all UserQuests for this quest (regardless of status)
    const allUserQuests = await UserQuest.find({
      questId: questId
    })
      .populate('userId', 'name email')
      .select('userId submissionData completedAt status')
      .lean();

    console.log(`🔍 Fetching reviews for quest ${questId}, menuItemId: ${menuItemId}`);
    console.log(`📋 Found ${allUserQuests.length} total UserQuests for this quest`);
    
    // Convert Map to object for easier access
    const userQuestsWithReviews = [];
    
    allUserQuests.forEach((uq, idx) => {
      // Handle submissionData - it might be a Map or an object
      let submissionDataObj = null;
      if (uq.submissionData) {
        if (uq.submissionData instanceof Map) {
          submissionDataObj = Object.fromEntries(uq.submissionData);
        } else if (typeof uq.submissionData === 'object') {
          submissionDataObj = uq.submissionData;
        }
      }
      
      const reviews = submissionDataObj?.reviews || null;
      const hasReviews = reviews && Array.isArray(reviews) && reviews.length > 0;
      
      console.log(`  UserQuest ${idx + 1}:`, {
        status: uq.status,
        hasSubmissionData: !!submissionDataObj,
        submissionDataType: uq.submissionData ? (uq.submissionData instanceof Map ? 'Map' : typeof uq.submissionData) : 'null',
        hasReviews: hasReviews,
        reviewsCount: reviews?.length || 0,
        completedAt: uq.completedAt
      });
      
      if (hasReviews) {
        userQuestsWithReviews.push({
          ...uq,
          submissionData: submissionDataObj
        });
      }
    });

    console.log(`📋 Found ${userQuestsWithReviews.length} UserQuests with reviews (any status)`);
    
    const userQuests = userQuestsWithReviews;

    console.log(`📋 Found ${userQuests.length} UserQuests with reviews (any status)`);

    const allReviews = [];
    const targetMenuItemId = menuItemId.toString();

    userQuests.forEach((userQuest, index) => {
      // Get reviews from submissionData (already converted to object)
      const questReviews = userQuest.submissionData?.reviews || [];
      
      console.log(`\n📝 UserQuest ${index + 1}:`, {
        userId: userQuest.userId?._id || userQuest.userId,
        hasSubmissionData: !!userQuest.submissionData,
        hasReviews: !!questReviews && Array.isArray(questReviews),
        reviewsCount: questReviews.length || 0
      });

      if (questReviews && Array.isArray(questReviews) && questReviews.length > 0) {
        questReviews.forEach((review, reviewIndex) => {
          // Try multiple ways to get menuItemId
          let reviewMenuItemId = null;
          
          if (review.menuItemId) {
            if (typeof review.menuItemId === 'object' && review.menuItemId._id) {
              reviewMenuItemId = review.menuItemId._id.toString();
            } else if (typeof review.menuItemId === 'object' && review.menuItemId.toString) {
              reviewMenuItemId = review.menuItemId.toString();
            } else {
              reviewMenuItemId = String(review.menuItemId);
            }
          }

          // Normalize both IDs to strings for comparison
          const normalizedReviewId = reviewMenuItemId ? String(reviewMenuItemId).trim() : null;
          const normalizedTargetId = String(targetMenuItemId).trim();

          console.log(`  Review ${reviewIndex + 1}:`, {
            reviewMenuItemId: reviewMenuItemId,
            normalizedReviewId: normalizedReviewId,
            targetMenuItemId: targetMenuItemId,
            normalizedTargetId: normalizedTargetId,
            exactMatch: normalizedReviewId === normalizedTargetId,
            rating: review.rating,
            hasComment: !!review.comment,
            reviewData: JSON.stringify(review)
          });

          // Compare both as strings (normalized)
          const matches = normalizedReviewId && normalizedReviewId === normalizedTargetId;

          if (matches) {
            const reviewToAdd = {
              menuItemId: review.menuItemId,
              rating: review.rating,
              comment: review.comment,
              userId: userQuest.userId?._id || userQuest.userId,
              userName: userQuest.userId?.name || 'ผู้ใช้',
              userEmail: userQuest.userId?.email,
              createdAt: userQuest.completedAt || userQuest.updatedAt
            };
            allReviews.push(reviewToAdd);
            console.log(`  ✅ Added review to results. Current allReviews.length: ${allReviews.length}`);
          }
        });
      }
    });

    console.log(`\n📊 Total reviews found: ${allReviews.length}`);
    console.log(`📊 allReviews array:`, JSON.stringify(allReviews, null, 2));

    // Sort by date (newest first)
    allReviews.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA;
    });

    res.json({
      success: true,
      message: 'Reviews retrieved successfully',
      data: allReviews,
      count: allReviews.length
    });

  } catch (error) {
    console.error('Error fetching menu item reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Helper function for trending
function getTrendingForRegion(region) {
  const trends = {
    'เหนือ': 'เทรนด์เช็คอินร้านกาแฟและสถานที่ท่องเที่ยวธรรมชาติ',
    'ตะวันออกเฉียงเหนือ': 'เทรนด์ร้านอาหารอีสานและตลาดนัดชุมชน',
    'กลาง': 'เทรนด์คาเฟ่และร้านอาหารแนวๆ',
    'ตะวันออก': 'เทรนด์เที่ยวทะเลและรีสอร์ท',
    'ตะวันตก': 'เทรนด์เที่ยวธรรมชาติและประวัติศาสตร์',
    'ใต้': 'เทรนด์ทะเลใต้และอาหารทะเลสด'
  };
  return trends[region] || 'เทรนด์กิจกรรมและร้านค้าท้องถิ่น';
}

module.exports = router;