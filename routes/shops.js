// backend/routes/shop.js
const express = require('express');
const router = express.Router();
const Shop = require('../models/Shop'); // ADD THIS IMPORT
const { auth } = require('../middleware/auth');
const { adminAuth } = require('../middleware/adminAuth');
const shopController = require('../controllers/shopController');

// Debug: list loaded controller functions
console.log("shopController loaded:", Object.keys(shopController));


// Option 1: Use Controller functions (Recommended)
router.get(
  '/admin/shops',
  auth,
  adminAuth,
  shopController.getAllShops
);

// Update shop status (Approve/Reject)
router.put('/admin/shops/:id/status', auth, async (req, res) => {
  try {
    const shopId = req.params.id;
    console.log(`🔍 Looking for shop with ID: ${shopId}`);
    
    if (req.user.userType !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Admin only.' 
      });
    }

    const { status, rejectionReason } = req.body;
    
    // Validate status
    const validStatuses = ['pending', 'active', 'rejected', 'suspended'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: pending, active, rejected, or suspended'
      });
    }

    // ✅ FIX: Use findOneAndUpdate with _id field explicitly
    const shop = await Shop.findOneAndUpdate(
      { _id: shopId }, // Explicitly search by _id
      { 
        status,
        ...(rejectionReason && { rejectionReason }),
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate('partnerId', 'name email');

    console.log(`🔍 Query result:`, shop);

    if (!shop) {
      // Log all shops to debug
      const allShops = await Shop.find().select('_id shopName status');
      console.log(`🔍 All available shops:`, allShops);
      
      return res.status(404).json({
        success: false,
        message: `Shop not found with ID: ${shopId}. Available shops: ${allShops.length}`
      });
    }

    console.log(`✅ Shop ${shop.shopId} status updated to: ${status}`);
    
    res.json({
      success: true,
      message: `Shop ${status === 'active' ? 'approved' : 'rejected'} successfully`,
      data: shop
    });

  } catch (error) {
    console.error('❌ Error updating shop status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating shop status',
      error: error.message
    });
  }
});

router.get(
  '/admin/shops/statistics',
  auth,
  adminAuth,
  shopController.getShopStatistics
);

// For shop owners (just auth middleware)
router.get(
  '/shops',
  auth,
  shopController.getAllShops
);

// Get shop by owner email
router.get('/owner/:email/shop', auth, async (req, res) => {
  try {
    const { email } = req.params;
    
    console.log(`🛍️ Fetching shop for owner email: ${email}`);
    
    // Check permissions
    if (req.user.userType === 'shop') {
      // Shop owners can only access their own shop
      if (req.user.email !== email) {
        return res.status(403).json({ 
          success: false,
          message: 'Access denied. You can only view your own shop.' 
        });
      }
    } else if (req.user.userType !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Shop owners and admins only.' 
      });
    }

    const shop = await Shop.findOne({ 
      $or: [
        { ownerEmail: email },
        { 'user.email': email }
      ],
      isDeleted: { $ne: true }
    }).populate('user', 'name email');

    if (!shop) {
      return res.status(404).json({ 
        success: false,
        message: 'Shop not found for this email' 
      });
    }

    console.log(`✅ Found shop: ${shop.shopName} for email: ${email}`);

    res.json({
      success: true,
      data: shop
    });

  } catch (error) {
    console.error('❌ Get shop by email error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get shops by owner email (returns array)
router.get('/owner/:email/shops', auth, async (req, res) => {
  try {
    const { email } = req.params;
    
    console.log(`🛍️ Fetching shops for owner email: ${email}`);
    
    // Check permissions
    if (req.user.userType === 'shop') {
      if (req.user.email !== email) {
        return res.status(403).json({ 
          success: false,
          message: 'Access denied. You can only view your own shops.' 
        });
      }
    } else if (req.user.userType !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Shop owners and admins only.' 
      });
    }

    const shops = await Shop.find({ 
      $or: [
        { ownerEmail: email },
        { 'user.email': email }
      ],
      isDeleted: { $ne: true }
    }).populate('user', 'name email');

    console.log(`✅ Found ${shops.length} shops for email: ${email}`);

    res.json({
      success: true,
      data: shops,
      count: shops.length
    });

  } catch (error) {
    console.error('❌ Get shops by email error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get active shops by province
router.get('/active', async (req, res) => {
  try {
    const { province, limit = 100 } = req.query;
    console.log('🔄 Fetching active shops for province:', province);

    let query = { status: 'active' };
    
    if (province) {
      query.province = province;
    }

    const shops = await Shop.find(query)
      .select('name description province district images category status')
      .limit(parseInt(limit))
      .lean();

    console.log(`✅ Found ${shops.length} active shops for ${province || 'all provinces'}`);
    
    res.json({
      success: true,
      data: shops,
      count: shops.length,
      province: province || 'all'
    });

  } catch (error) {
    console.error('❌ Error fetching active shops:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching active shops',
      error: error.message
    });
  }
});

// Get shops by region
router.get('/region/:region', async (req, res) => {
  try {
    const { region } = req.params;
    const { limit = 100 } = req.query;
    
    console.log('🔄 Fetching shops for region:', region);

    // Define province mapping for regions
    const regionProvinces = {
      'กลาง': ['กรุงเทพมหานคร', 'นนทบุรี', 'ปทุมธานี', 'สมุทรปราการ', 'พระนครศรีอยุธยา', 
               'อ่างทอง', 'ลพบุรี', 'สิงห์บุรี', 'ชัยนาท', 'สระบุรี'],
      'เหนือ': ['เชียงใหม่', 'เชียงราย', 'ลำพูน', 'ลำปาง', 'แพร่', 'น่าน', 'พะเยา', 'แม่ฮ่องสอน'],
      'ตะวันออกเฉียงเหนือ': ['ขอนแก่น', 'อุบลราชธานี', 'นครราชสีมา', 'อุดรธานี', 'มหาสารคาม', 
                            'ร้อยเอ็ด', 'กาฬสินธุ์', 'สกลนคร', 'บุรีรัมย์', 'สุรินทร์'],
      'ตะวันออก': ['ชลบุรี', 'ระยอง', 'จันทบุรี', 'ตราด', 'ฉะเชิงเทรา', 'ปราจีนบุรี', 'สระแก้ว'],
      'ตะวันตก': ['กาญจนบุรี', 'ราชบุรี', 'เพชรบุรี', 'ประจวบคีรีขันธ์', 'ตาก', 'สุพรรณบุรี'],
      'ใต้': ['ภูเก็ต', 'สงขลา', 'นครศรีธรรมราช', 'สุราษฎร์ธานี', 'กระบี่', 'พังงา', 'ตรัง']
    };

    const provinces = regionProvinces[region] || [];
    
    if (provinces.length === 0) {
      return res.json({
        success: true,
        data: [],
        count: 0,
        message: `No provinces found for region: ${region}`
      });
    }

    const shops = await Shop.find({
      province: { $in: provinces },
      status: 'active'
    })
      // .select('name description province district images category status')
      // .select('shopId shopName shopType description province district address phone businessHours status images')
    .limit(parseInt(limit))
    .lean();
    console.log(shops)
    console.log(`✅ Found ${shops.length} shops in region: ${region}`);
    
    res.json({
      success: true,
      data: shops,
      count: shops.length,
      region: region
    });

  } catch (error) {
    console.error('❌ Error fetching shops by region:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching shops by region',
      error: error.message
    });
  }
});

// routes/shops.js - ADD THIS ENDPOINT
// Get shop by ID
router.get('/:shopId', async (req, res) => {
  try {
    const { shopId } = req.params;
    console.log('🏪 Fetching shop by ID:', shopId);

    const shop = await Shop.findById(shopId).lean();

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบร้านค้า'
      });
    }

    // Get active quests count for this shop
    const activeQuestsCount = await Quest.countDocuments({
      shopId: shopId,
      status: 'active',
      endDate: { $gte: new Date() }
    });

    const shopData = {
      ...shop,
      activeQuests: activeQuestsCount,
      totalQuests: activeQuestsCount // You can add total quests count if needed
    };

    console.log(`✅ Found shop: ${shop.shopName} with ${activeQuestsCount} active quests`);
    
    res.json({
      success: true,
      data: shopData
    });

  } catch (error) {
    console.error('❌ Error fetching shop by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching shop data',
      error: error.message
    });
  }
});

// Get all shops by user ID (for shop owners)
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 100, page = 1 } = req.query;
    
    console.log('👤 Fetching shops for user:', userId);

    // Calculate skip for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Find shops where partnerId matches userId
    const shops = await Shop.find({
      partnerId: userId,
      status: { $in: ['active', 'inactive', 'pending'] } // Include all statuses
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

    // Get total count for pagination
    const totalShops = await Shop.countDocuments({
      partnerId: userId
    });

    // Get counts by status
    const statusCounts = await Shop.aggregate([
      {
        $match: { partnerId: userId }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log(`✅ Found ${shops.length} shops for user ${userId}`);

    res.json({
      success: true,
      data: shops,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalShops / parseInt(limit)),
        totalShops: totalShops,
        hasNext: (parseInt(page) * parseInt(limit)) < totalShops,
        hasPrev: parseInt(page) > 1
      },
      statusCounts: statusCounts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      message: `Found ${shops.length} shops`
    });

  } catch (error) {
    console.error('❌ Error fetching shops by user:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user shops',
      error: error.message
    });
  }
});


module.exports = router;