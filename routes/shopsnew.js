// backend/routes/shopQuests.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Quest = require('../models/Quest');
const QuestTemplate = require('../models/QuestTemplate');
const Shop = require('../models/Shop');

// Apply auth middleware to all routes
router.use(auth);

// Create quest from template - THIS IS THE MISSING ROUTE
router.post('/quests', async (req, res) => {
  try {
    console.log('🔄 Creating quest for user:', req.user.userType);
    
    // Only allow shop owners and admins
    if (req.user.userType !== 'shop' && req.user.userType !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Shop owners and admins only.' 
      });
    }

    const { templateId, budget, maxParticipants, duration } = req.body;
    
    // Validate required fields
    if (!templateId || !budget || !maxParticipants) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: templateId, budget, maxParticipants'
      });
    }

    // Get template
    const template = await QuestTemplate.findById(templateId);
    if (!template) {
      return res.status(404).json({ 
        success: false,
        message: 'Template not found' 
      });
    }

    // For shop owner: use their own shop
    // For admin: require shopId in request body
    let shopId;
    if (req.user.userType === 'shop') {
      const shop = await Shop.findOne({ user: req.user.id });
      if (!shop) {
        return res.status(404).json({ 
          success: false,
          message: 'Shop not found' 
        });
      }
      shopId = shop._id;
    } else if (req.user.userType === 'admin') {
      shopId = req.body.shopId;
      if (!shopId) {
        return res.status(400).json({
          success: false,
          message: 'shopId is required for admin users'
        });
      }
    }

    // Calculate reward amount per participant
    const rewardAmount = parseFloat(budget) / parseInt(maxParticipants);
    
    // Create quest
    const quest = new Quest({
      name: template.name,
      description: template.description,
      template: templateId,
      shop: shopId,
      budget: parseFloat(budget),
      rewardAmount: rewardAmount,
      rewardPoints: template.rewardPoints,
      maxParticipants: parseInt(maxParticipants),
      duration: parseInt(duration) || 7,
      status: 'active',
      isActive: true,
      createdBy: req.user.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + (parseInt(duration) || 7) * 24 * 60 * 60 * 1000)
    });

    await quest.save();
    await quest.populate('template');
    await quest.populate('shop', 'shopName province');

    console.log('✅ Quest created:', {
      id: quest._id,
      name: quest.name,
      shop: quest.shop?.shopName,
      userType: req.user.userType,
      budget: quest.budget,
      participants: quest.maxParticipants
    });

    res.status(201).json({
      success: true,
      message: 'Quest created successfully',
      data: quest
    });

  } catch (error) {
    console.error('❌ Create quest error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get quests - Role-based filtering
router.get('/quests', async (req, res) => {
  try {
    let query = { isDeleted: { $ne: true } };
    
    // Shop owner can only see their own shop's quests
    if (req.user.userType === 'shop') {
      const shop = await Shop.findOne({ user: req.user.id });
      if (!shop) {
        return res.status(404).json({ 
          success: false,
          message: 'Shop not found' 
        });
      }
      query.shop = shop._id;
    }
    // Admin can see all quests (no additional query)
    else if (req.user.userType !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Shop owners and admins only.' 
      });
    }

    console.log(`🔍 ${req.user.userType} fetching quests with query:`, query);
    
    const quests = await Quest.find(query)
      .populate('template')
      .populate('shop', 'shopName province phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: quests,
      count: quests.length,
      userType: req.user.userType
    });

  } catch (error) {
    console.error('❌ Get quests error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get all shops (for admin) or specific shop (for shop owner)
router.get('/shops', async (req, res) => {
  try {
    console.log('🔍 Fetching shops for user type:', req.user.userType);
    
    let shops;
    
    // Admin can see all shops
    if (req.user.userType === 'admin') {
      shops = await Shop.find({ isDeleted: { $ne: true } })
        .populate('user', 'name email')
        .sort({ createdAt: -1 });
    } 
    // Shop owner can only see their own shop
    else if (req.user.userType === 'shop') {
      shops = await Shop.find({ 
        user: req.user.id, 
        isDeleted: { $ne: true } 
      })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    } 
    // Other users not allowed
    else {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Shop owners and admins only.' 
      });
    }

    console.log(`✅ Found ${shops.length} shops for ${req.user.userType}`);
    
    res.json({
      success: true,
      data: shops,
      count: shops.length
    });

  } catch (error) {
    console.error('❌ Get shops error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching shops', 
      error: error.message 
    });
  }
});

// Get single shop by ID
router.get('/shops/:id', async (req, res) => {
  try {
    const shop = await Shop.findOne({
      _id: req.params.id,
      isDeleted: { $ne: true }
    }).populate('user', 'name email');

    if (!shop) {
      return res.status(404).json({ 
        success: false,
        message: 'Shop not found' 
      });
    }

    // Authorization check
    if (req.user.userType === 'shop') {
      const userShop = await Shop.findOne({ user: req.user.id });
      if (!userShop || userShop._id.toString() !== req.params.id) {
        return res.status(403).json({ 
          success: false,
          message: 'Access denied to this shop' 
        });
      }
    } else if (req.user.userType !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied' 
      });
    }

    res.json({
      success: true,
      data: shop
    });

  } catch (error) {
    console.error('❌ Get shop error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

module.exports = router;