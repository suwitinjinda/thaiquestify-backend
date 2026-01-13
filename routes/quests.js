// routes/quests.js - COMPLETE CORRECTED VERSION
const express = require('express');
const router = express.Router();

// REQUIRED IMPORTS - MAKE SURE THESE ARE AT THE TOP
const Quest = require('../models/Quest');
const QuestTemplate = require('../models/QuestTemplate'); // ADD THIS LINE
const Shop = require('../models/Shop'); // ADD THIS LINE
const User = require('../models/User'); // ADD THIS LINE if needed
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

// Get quests by shop ID
router.get('/shop/:shopId', async (req, res) => {
  try {
    const { shopId } = req.params;
    console.log('🏪 Fetching quests for shop:', shopId);

    const quests = await Quest.find({
      shopId: shopId,
      status: 'active',
      endDate: { $gte: new Date() }
    })
    .populate('shop', 'shopName province district')
    .sort({ createdAt: -1 })
    .lean();
    
    console.log(`✅ Found ${quests.length} quests for shop ${shopId}`);
    
    const transformedQuests = quests.map(quest => ({
      _id: quest._id,
      name: quest.name,
      description: quest.description,
      instructions: quest.instructions,
      rewardAmount: quest.rewardAmount,
      rewardPoints: quest.rewardPoints,
      category: quest.category,
      difficulty: quest.difficulty,
      status: quest.status,
      startDate: quest.startDate,
      endDate: quest.endDate,
      currentParticipants: quest.currentParticipants,
      maxParticipants: quest.maxParticipants,
      verificationType: quest.verificationMethod || quest.verificationType,
      requirements: quest.requirements || []
    }));

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
    const existingParticipation = await UserQuest.findOne({
      userId: userId,
      questId: questId
    });

    if (existingParticipation) {
      return res.status(400).json({
        success: false,
        message: 'Already participating in this quest'
      });
    }

    // Create participation record
    const userQuest = new UserQuest({
      userId: userId,
      questId: questId,
      questName: quest.name,
      shopId: quest.shopId,
      rewardAmount: quest.rewardAmount,
      rewardPoints: quest.rewardPoints,
      status: 'participating',
      joinedAt: new Date()
    });

    await userQuest.save();

    // Update quest participant count
    quest.currentParticipants += 1;
    await quest.save();

    res.json({
      success: true,
      message: 'Successfully joined quest',
      data: userQuest
    });

  } catch (error) {
    console.error('Error participating in quest:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
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

    if (userQuest.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Quest already completed'
      });
    }

    // Update quest completion
    userQuest.status = 'completed';
    userQuest.verifiedAt = new Date();
    userQuest.verificationData = verificationData || { latitude, longitude };
    userQuest.completedAt = new Date();
    await userQuest.save();

    // Update quest spending
    quest.totalSpent += quest.rewardAmount;
    await quest.save();

    // Add to user's submissions
    await Quest.findByIdAndUpdate(questId, {
      $push: {
        submissions: {
          userId: userId,
          verifiedAt: new Date(),
          rewardAmount: quest.rewardAmount,
          rewardPoints: quest.rewardPoints
        }
      }
    });

    // TODO: Add reward to user's account

    res.json({
      success: true,
      message: 'Quest completed successfully',
      data: {
        rewardAmount: quest.rewardAmount,
        rewardPoints: quest.rewardPoints,
        completedAt: userQuest.completedAt
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