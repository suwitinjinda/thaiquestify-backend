// backend/routes/shop.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Shop = require('../models/Shop'); // ADD THIS IMPORT
const Quest = require('../models/Quest');
const QuestSettings = require('../models/QuestSettings');
const User = require('../models/User');
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
    let shop = await Shop.findOne({ _id: shopId });

    if (!shop) {
      // Log all shops to debug
      const allShops = await Shop.find().select('_id shopName status');
      console.log(`🔍 All available shops:`, allShops);
      
      return res.status(404).json({
        success: false,
        message: `Shop not found with ID: ${shopId}. Available shops: ${allShops.length}`
      });
    }

    // Generate unique shop ID when approving (if not already generated)
    if (status === 'active' && !shop.shopId) {
      const { generateUniqueShopId } = require('../utils/shopIdGenerator');
      const uniqueShopId = await generateUniqueShopId();
      
      shop.shopId = uniqueShopId;
      console.log(`✅ Generated unique shop ID: ${uniqueShopId} for shop: ${shop.shopName}`);
      
      // Images should already be uploaded to GCP when shop was submitted
      // If images are still base64 or not URLs, upload them now
      if (shop.images && shop.images.length > 0) {
        try {
          // Check if images are base64 strings or not URLs
          const needsUpload = shop.images.some(img => 
            typeof img === 'object' || 
            (typeof img === 'string' && (img.startsWith('data:') || !img.includes('storage.googleapis.com')))
          );
          
          if (needsUpload) {
            const { uploadShopImages } = require('../utils/gcpStorage');
            const imageBuffers = shop.images.map(img => {
              if (typeof img === 'string' && img.startsWith('data:')) {
                // Base64 data URL
                const base64Data = img.split(',')[1];
                return {
                  buffer: Buffer.from(base64Data, 'base64'),
                  mimeType: img.match(/data:([^;]+)/)?.[1] || 'image/jpeg'
                };
              } else if (typeof img === 'object' && img.buffer) {
                return {
                  buffer: Buffer.from(img.buffer, 'base64'),
                  mimeType: img.mimeType || 'image/jpeg'
                };
              }
              return null;
            }).filter(Boolean);
            
            if (imageBuffers.length > 0) {
              const uploadedUrls = await uploadShopImages(imageBuffers, uniqueShopId);
              shop.images = uploadedUrls;
              console.log(`✅ Uploaded ${uploadedUrls.length} images to GCP for shop ${uniqueShopId}`);
            }
          } else {
            console.log(`✅ Shop images already uploaded to GCP`);
          }
        } catch (uploadError) {
          console.error('❌ Error uploading images to GCP:', uploadError);
          // Continue with approval even if image upload fails
        }
      }
    }

    // Update shop status and other fields
    shop.status = status;
    if (rejectionReason) {
      shop.rejectionReason = rejectionReason;
    }
    if (status === 'active') {
      shop.approvedAt = new Date();
      shop.approvedBy = req.user.id;
      
      // Update ShopRequest status to 'registered' when shop is approved
      try {
        const ShopRequest = require('../models/ShopRequest');
        const shopRequest = await ShopRequest.findOne({ shopId: shop._id });
        if (shopRequest) {
          shopRequest.status = 'registered';
          shopRequest.registeredAt = new Date();
          await shopRequest.save();
          console.log(`✅ Updated ShopRequest ${shopRequest._id} status to 'registered'`);
        }
      } catch (requestError) {
        console.error('❌ Error updating ShopRequest status:', requestError);
        // Continue with shop approval even if request update fails
      }
      
      // Auto-create check-in quest for approved shop (similar to tourist quest)
      try {
        const Quest = require('../models/Quest');
        const QuestSettings = require('../models/QuestSettings');
        const User = require('../models/User');
        
        // Check if quest already exists for this shop
        const existingQuest = await Quest.findOne({
          shopId: shop.shopId || shop._id.toString(),
          type: 'location_checkin',
          status: 'active'
        });
        
        if (!existingQuest && shop.shopId) {
          // Get system user for createdBy field
          let systemUser = await User.findOne({ email: 'system@thaiquestify.com' });
          if (!systemUser) {
            systemUser = new User({
              name: 'System',
              email: 'system@thaiquestify.com',
              userType: 'admin',
              password: 'system',
            });
            await systemUser.save();
          }
          
          // Get points from settings (default 10)
          const pointsSetting = await QuestSettings.getSetting('shop_checkin_points') || 10;
          
          // Create check-in quest automatically
          const checkInQuest = new Quest({
            name: `เช็คอินที่ ${shop.shopName}`,
            description: `เช็คอินที่ ${shop.shopName}${shop.description ? ` - ${shop.description}` : ''}`,
            shopId: shop.shopId,
            shop: shop._id,
            type: 'location_checkin',
            verificationMethod: 'location_verification',
            category: 'check-in',
            rewardAmount: 0,
            rewardPoints: pointsSetting,
            budget: 0,
            maxParticipants: 999999, // Unlimited participants
            currentParticipants: 0,
            duration: 365, // Quest lasts 1 year
            locationName: shop.shopName,
            address: shop.address || `${shop.district || ''} ${shop.province}`.trim(),
            coordinates: shop.coordinates ? `${shop.coordinates.latitude},${shop.coordinates.longitude}` : '',
            status: 'active',
            startDate: new Date(),
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
            isOneTimeQuest: true, // One-time quest flag
            createdBy: systemUser._id,
            instructions: `ไปที่ ${shop.shopName} และเช็คอินด้วย GPS location (ทำได้ครั้งเดียว)`
          });
          
          await checkInQuest.save();
          console.log(`✅ Auto-created check-in quest for shop ${shop.shopId}: ${checkInQuest._id}`);
        }
      } catch (questError) {
        console.error('❌ Error creating auto check-in quest:', questError);
        // Continue with shop approval even if quest creation fails
      }
    }
    shop.updatedAt = new Date();

    await shop.save();
    await shop.populate('partnerId', 'name email');

    console.log(`✅ Shop ${shop.shopId || 'N/A'} status updated to: ${status}`);
    
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

// Get shop revenue statistics (daily/monthly/yearly)
router.get('/admin/shops/revenue-statistics', auth, adminAuth, async (req, res) => {
  try {
    const { period = 'daily' } = req.query; // 'daily', 'monthly', 'yearly'
    const Order = require('../models/Order');
    
    const now = new Date();
    let startDate, endDate, groupFormat;
    
    // Set date range and aggregation format based on period
    if (period === 'daily') {
      // Last 30 days
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
      endDate = now;
      groupFormat = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' }
      };
    } else if (period === 'monthly') {
      // Last 12 months
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 12);
      endDate = now;
      groupFormat = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' }
      };
    } else if (period === 'yearly') {
      // Last 5 years
      startDate = new Date(now);
      startDate.setFullYear(startDate.getFullYear() - 5);
      endDate = now;
      groupFormat = {
        year: { $year: '$createdAt' }
      };
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid period. Must be: daily, monthly, or yearly'
      });
    }
    
    // Aggregate revenue by period
    const revenueData = await Order.aggregate([
      {
        $match: {
          status: 'completed',
          paymentStatus: 'paid',
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: groupFormat,
          totalRevenue: { $sum: '$total' },
          orderCount: { $sum: 1 },
          avgOrderValue: { $avg: '$total' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);
    
    // Format data for frontend
    const formattedData = revenueData.map(item => {
      let label;
      if (period === 'daily') {
        const date = new Date(item._id.year, item._id.month - 1, item._id.day);
        label = date.toLocaleDateString('th-TH', { day: '2-digit', month: 'short' });
      } else if (period === 'monthly') {
        const date = new Date(item._id.year, item._id.month - 1);
        label = date.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
      } else {
        label = `${item._id.year}`;
      }
      
      return {
        label,
        revenue: item.totalRevenue,
        orderCount: item.orderCount,
        avgOrderValue: Math.round(item.avgOrderValue * 100) / 100
      };
    });
    
    // Calculate summary
    const totalRevenue = formattedData.reduce((sum, item) => sum + item.revenue, 0);
    const totalOrders = formattedData.reduce((sum, item) => sum + item.orderCount, 0);
    const avgRevenue = formattedData.length > 0 ? totalRevenue / formattedData.length : 0;
    
    res.json({
      success: true,
      data: {
        period,
        data: formattedData,
        summary: {
          totalRevenue,
          totalOrders,
          avgRevenue: Math.round(avgRevenue * 100) / 100,
          avgOrderValue: totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0
        }
      }
    });
  } catch (error) {
    console.error('Get revenue statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get shop revenue statistics for specific shop (shop owner only)
router.get('/shops/:shopId/revenue-statistics', auth, async (req, res) => {
  try {
    const { shopId } = req.params;
    const { period = 'daily' } = req.query; // 'daily', 'monthly', 'yearly'
    const Order = require('../models/Order');
    const Shop = require('../models/Shop');
    const mongoose = require('mongoose');
    
    // Find shop and verify ownership
    let shop;
    if (mongoose.Types.ObjectId.isValid(shopId) && shopId.length === 24) {
      shop = await Shop.findById(shopId);
    } else {
      shop = await Shop.findOne({ shopId: shopId });
    }
    
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบร้านค้า'
      });
    }
    
    // Verify ownership: check if user owns this shop
    const userId = req.user.id || req.user._id;
    const isOwner = shop.user?.toString() === userId.toString() || 
                    shop.ownerEmail === req.user.email ||
                    (shop.partnerId && req.user.partnerId && shop.partnerId.toString() === req.user.partnerId.toString());
    
    if (!isOwner && req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์เข้าถึงสถิติของร้านค้านี้'
      });
    }
    
    // Get shop ObjectId for matching orders
    const shopObjectId = shop._id;
    
    const now = new Date();
    let startDate, endDate, groupFormat;
    
    // Set date range and aggregation format based on period
    if (period === 'daily') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
      endDate = now;
      groupFormat = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' }
      };
    } else if (period === 'monthly') {
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 12);
      endDate = now;
      groupFormat = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' }
      };
    } else if (period === 'yearly') {
      startDate = new Date(now);
      startDate.setFullYear(startDate.getFullYear() - 5);
      endDate = now;
      groupFormat = {
        year: { $year: '$createdAt' }
      };
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid period. Must be: daily, monthly, or yearly'
      });
    }
    
    // Aggregate revenue by period for this specific shop - แยกตาม orderType (dine_in vs delivery)
    const revenueData = await Order.aggregate([
      {
        $match: {
          shop: shopObjectId,
          paymentStatus: 'paid', // นับเฉพาะที่จ่ายเงินเสร็จแล้ว
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: groupFormat, // Group by period only (not by orderType)
          totalRevenue: { $sum: '$total' },
          orderCount: { $sum: 1 },
          avgOrderValue: { $avg: '$total' },
          dineInRevenue: {
            $sum: {
              $cond: [
                { $or: [{ $eq: ['$orderType', 'dine_in'] }, { $eq: ['$orderType', null] }] },
                '$total',
                0
              ]
            }
          },
          dineInCount: {
            $sum: {
              $cond: [
                { $or: [{ $eq: ['$orderType', 'dine_in'] }, { $eq: ['$orderType', null] }] },
                1,
                0
              ]
            }
          },
          deliveryRevenue: {
            $sum: {
              $cond: [{ $eq: ['$orderType', 'delivery'] }, '$total', 0]
            }
          },
          deliveryCount: {
            $sum: {
              $cond: [{ $eq: ['$orderType', 'delivery'] }, 1, 0]
            }
          }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);
    
    // Format data for frontend
    const formattedData = revenueData.map(item => {
      let label;
      if (period === 'daily') {
        const date = new Date(item._id.year, item._id.month - 1, item._id.day);
        label = date.toLocaleDateString('th-TH', { day: '2-digit', month: 'short' });
      } else if (period === 'monthly') {
        const date = new Date(item._id.year, item._id.month - 1);
        label = date.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
      } else {
        label = `${item._id.year}`;
      }
      
      return {
        label,
        revenue: item.totalRevenue,
        orderCount: item.orderCount,
        avgOrderValue: Math.round(item.avgOrderValue * 100) / 100,
        dineInRevenue: item.dineInRevenue || 0,
        dineInCount: item.dineInCount || 0,
        deliveryRevenue: item.deliveryRevenue || 0,
        deliveryCount: item.deliveryCount || 0,
        dineInAvgOrderValue: item.dineInCount > 0 ? Math.round((item.dineInRevenue / item.dineInCount) * 100) / 100 : 0,
        deliveryAvgOrderValue: item.deliveryCount > 0 ? Math.round((item.deliveryRevenue / item.deliveryCount) * 100) / 100 : 0
      };
    });
    
    // Calculate summary - แยกตาม orderType
    const totalRevenue = formattedData.reduce((sum, item) => sum + item.revenue, 0);
    const totalOrders = formattedData.reduce((sum, item) => sum + item.orderCount, 0);
    const totalDineInRevenue = formattedData.reduce((sum, item) => sum + item.dineInRevenue, 0);
    const totalDineInOrders = formattedData.reduce((sum, item) => sum + item.dineInCount, 0);
    const totalDeliveryRevenue = formattedData.reduce((sum, item) => sum + item.deliveryRevenue, 0);
    const totalDeliveryOrders = formattedData.reduce((sum, item) => sum + item.deliveryCount, 0);
    const avgRevenue = formattedData.length > 0 ? totalRevenue / formattedData.length : 0;
    
    res.json({
      success: true,
      data: {
        period,
        data: formattedData,
        summary: {
          totalRevenue,
          totalOrders,
          avgRevenue: Math.round(avgRevenue * 100) / 100,
          avgOrderValue: totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0,
          // แยกตาม orderType
          dineIn: {
            revenue: totalDineInRevenue,
            orders: totalDineInOrders,
            avgOrderValue: totalDineInOrders > 0 ? Math.round((totalDineInRevenue / totalDineInOrders) * 100) / 100 : 0
          },
          delivery: {
            revenue: totalDeliveryRevenue,
            orders: totalDeliveryOrders,
            avgOrderValue: totalDeliveryOrders > 0 ? Math.round((totalDeliveryRevenue / totalDeliveryOrders) * 100) / 100 : 0
          }
        }
      }
    });
  } catch (error) {
    console.error('Get shop revenue statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

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
    
    // Allow users to view their own shop (by email match)
    // Also allow admins to view any shop
    if (req.user.userType === 'shop') {
      // Shop owners can only access their own shop
      if (req.user.email !== decodedEmail) {
        return res.status(403).json({ 
          success: false,
          message: 'Access denied. You can only view your own shop.' 
        });
      }
    } else if (req.user.userType !== 'admin') {
      // Regular users (customer) can only view their own shop
      if (req.user.email !== decodedEmail) {
        return res.status(403).json({ 
          success: false,
          message: 'Access denied. You can only view your own shop.' 
        });
      }
    }

    const shop = await Shop.findOne({ 
      $or: [
        { ownerEmail: decodedEmail },
        { 'user.email': decodedEmail }
      ],
      isDeleted: { $ne: true }
    }).populate('user', 'name email');

    if (!shop) {
      return res.status(404).json({ 
        success: false,
        message: 'Shop not found for this email' 
      });
    }

    console.log(`✅ Found shop: ${shop.shopName} for email: ${decodedEmail}`);

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
    const decodedEmail = decodeURIComponent(email);
    
    console.log(`🛍️ Fetching shops for owner email: ${decodedEmail}`);
    console.log(`🔍 User email: ${req.user.email}, Requested email: ${decodedEmail}`);
    
    // Allow users to view their own shops (by email match)
    // Also allow admins to view any shops
    if (req.user.userType === 'shop') {
      if (req.user.email !== decodedEmail) {
        return res.status(403).json({ 
          success: false,
          message: 'Access denied. You can only view your own shops.' 
        });
      }
    } else if (req.user.userType !== 'admin') {
      // Regular users (customer) can only view their own shops
      if (req.user.email !== decodedEmail) {
        return res.status(403).json({ 
          success: false,
          message: 'Access denied. You can only view your own shops.' 
        });
      }
    }

    // Find user by email first to get ObjectId
    const User = require('../models/User');
    const ownerUser = await User.findOne({ email: decodedEmail }).select('_id');
    
    // Build query: match by ownerEmail OR user ObjectId
    const queryConditions = [
      { ownerEmail: decodedEmail }
    ];
    
    if (ownerUser?._id) {
      queryConditions.push({ user: ownerUser._id });
    }

    const shops = await Shop.find({ 
      $or: queryConditions,
      isDeleted: { $ne: true }
    })
    .populate('user', 'name email')
    .sort({ createdAt: -1 }); // Sort by newest first

    console.log(`✅ Found ${shops.length} shops for email: ${decodedEmail} (checked ownerEmail and user ObjectId)`);

    // Convert image URLs to signed URLs for frontend access
    const { getSignedUrls } = require('../utils/gcpStorage');
    const shopsWithSignedUrls = await Promise.all(
      shops.map(async (shop) => {
        const shopObj = shop.toObject ? shop.toObject() : shop;
        if (shopObj.images && Array.isArray(shopObj.images) && shopObj.images.length > 0) {
          try {
            shopObj.images = await getSignedUrls(shopObj.images);
          } catch (signedUrlError) {
            console.error('❌ Error generating signed URLs for shop images:', signedUrlError);
            // Continue with original URLs if signed URL generation fails
          }
        }
        return shopObj;
      })
    );

    res.json({
      success: true,
      data: shopsWithSignedUrls,
      count: shopsWithSignedUrls.length
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

// Get active shops by province (public endpoint - no auth required)
router.get('/active', async (req, res) => {
  try {
    const { province, limit = 1000 } = req.query;
    console.log('🔄 Fetching active shops for province:', province);

    let query = { 
      status: 'active',
      isDeleted: { $ne: true }
    };
    
    if (province) {
      // Normalize province name for matching
      const normalizeProvince = (name) => {
        if (!name) return '';
        return name.replace(/จังหวัด/g, '').replace(/ฯ/g, '').trim();
      };
      
      const normalizedProvince = normalizeProvince(province);
      query.$or = [
        { province: normalizedProvince },
        { province: { $regex: normalizedProvince, $options: 'i' } }
      ];
    }

    const shops = await Shop.find(query)
      .select('shopName name description province district images shopType category status shopId coordinates phone address deliveryOption isOpen businessHours')
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .lean();

    // Convert image URLs to signed URLs for frontend access
    const { getSignedUrls } = require('../utils/gcpStorage');
    const shopsWithSignedUrls = await Promise.all(
      shops.map(async (shop) => {
        const shopObj = { ...shop };
        if (shopObj.images && Array.isArray(shopObj.images) && shopObj.images.length > 0) {
          try {
            shopObj.images = await getSignedUrls(shopObj.images);
          } catch (signedUrlError) {
            console.error('❌ Error generating signed URLs for shop images:', signedUrlError);
            // Continue with original URLs if signed URL generation fails
          }
        }
        return shopObj;
      })
    );

    // Map shop fields for frontend compatibility
    const mappedShops = shopsWithSignedUrls.map(shop => ({
      ...shop,
      name: shop.shopName || shop.name, // Use shopName as primary name
      category: shop.shopType || shop.category || 'shop',
      // Ensure businessHours is preserved
      businessHours: shop.businessHours || shop.workingHours || ''
    }));

    res.json({
      success: true,
      data: mappedShops,
      count: mappedShops.length,
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

// Update shop status by owner (open/close)
router.put('/:id/status-owner', auth, async (req, res) => {
  try {
    const { id } = req.params; // MongoDB _id
    const { status } = req.body;

    const allowedStatuses = ['active', 'suspended'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Allowed values: active, suspended',
      });
    }

    const shop = await Shop.findById(id);
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found',
      });
    }

    // Allow only the shop owner (by email) or linked user to update
    const userEmail = req.user.email;
    const isOwner =
      (shop.ownerEmail && shop.ownerEmail === userEmail) ||
      (shop.user && shop.user.email && shop.user.email === userEmail);

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own shop.',
      });
    }

    shop.status = status;
    shop.updatedAt = new Date();
    await shop.save();

    console.log(`✅ Owner updated shop ${shop.shopId || shop._id} status to: ${status}`);

    res.json({
      success: true,
      message: 'Shop status updated successfully',
      data: shop,
    });
  } catch (error) {
    console.error('❌ Error updating shop status by owner:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating shop status',
      error: error.message,
    });
  }
});

// Update shop info by owner (all fields)
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      shopName,
      shopType,
      province,
      district,
      address,
      phone,
      businessHours,
      description,
      taxId,
      shopMode,
      isOpen,
      deliveryOption,
      deliveryRadiusKm,
      deliveryPrice,
      includeVat,
      vatRate,
      bankAccount,
      coordinates,
      images,
    } = req.body;

    const shop = await Shop.findById(id);
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found',
      });
    }

    // Only owner (by email) or linked user can edit
    const userEmail = req.user.email;
    const isOwner =
      (shop.ownerEmail && shop.ownerEmail === userEmail) ||
      (shop.user && shop.user.email && shop.user.email === userEmail);

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own shop.',
      });
    }

    // Update basic fields
    if (typeof shopName === 'string' && shopName.trim()) {
      shop.shopName = shopName.trim();
    }
    if (shopType && ['Restaurant/Cafe', 'Retail Store', 'Service Business', 'Hotel/Accommodation', 'Tour Operator', 'Other'].includes(shopType)) {
      shop.shopType = shopType;
    }
    if (typeof province === 'string' && province.trim()) {
      shop.province = province.trim();
    }
    if (typeof district === 'string') {
      shop.district = district.trim();
    }
    if (typeof address === 'string') {
      shop.address = address.trim();
    }
    if (typeof phone === 'string' && phone.trim()) {
      shop.phone = phone.trim();
    }
    if (typeof businessHours === 'string') {
      shop.businessHours = businessHours.trim();
    }
    if (typeof description === 'string') {
      shop.description = description.trim();
    }
    if (typeof taxId === 'string') {
      shop.taxId = taxId.trim();
    }
    if (shopMode && ['online', 'offline', 'both'].includes(shopMode)) {
      shop.shopMode = shopMode;
    }
    if (typeof isOpen === 'boolean') {
      shop.isOpen = isOpen;
    }
    if (deliveryOption && ['self', 'accept_delivery', 'both'].includes(deliveryOption)) {
      shop.deliveryOption = deliveryOption;
    }
    // Update delivery radius (only if provided and >= 0)
    if (deliveryRadiusKm !== undefined && deliveryRadiusKm !== null && !Number.isNaN(Number(deliveryRadiusKm))) {
      const radiusNum = Number(deliveryRadiusKm);
      if (radiusNum >= 0) {
        shop.deliveryRadiusKm = radiusNum;
      }
    }
    // Update delivery price (with minimum from admin settings)
    if (deliveryPrice !== undefined && deliveryPrice !== null && !Number.isNaN(Number(deliveryPrice))) {
      const priceNum = Number(deliveryPrice);

      // อ่านค่า minimum จาก QuestSettings (ถ้าไม่มีให้ถือว่า 0)
      let minDeliveryPrice = 0;
      try {
        const minSetting = await QuestSettings.getSetting('delivery_min_price');
        if (typeof minSetting === 'number') {
          minDeliveryPrice = minSetting;
        }
      } catch (settingsError) {
        console.error('❌ Error reading delivery_min_price from QuestSettings:', settingsError);
      }

      if (priceNum < minDeliveryPrice) {
        return res.status(400).json({
          success: false,
          message: `ค่าจ้างส่งขั้นต่ำคือ ${minDeliveryPrice.toFixed(2)} บาท กรุณากรอกจำนวนเงินไม่น้อยกว่านี้`,
        });
      }

      shop.deliveryPrice = priceNum;
    }
    if (typeof includeVat === 'boolean') {
      shop.includeVat = includeVat;
    }
    if (vatRate !== undefined && vatRate !== null && !Number.isNaN(Number(vatRate))) {
      const rate = Number(vatRate);
      if (rate >= 0 && rate <= 100) {
        shop.vatRate = rate;
      }
    }
    if (coordinates && typeof coordinates === 'object' && coordinates.latitude && coordinates.longitude) {
      shop.coordinates = {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      };
    }
    if (bankAccount && typeof bankAccount === 'object') {
      shop.bankAccount = {
        accountName: bankAccount.accountName || shop.bankAccount?.accountName || '',
        accountNumber: bankAccount.accountNumber || shop.bankAccount?.accountNumber || '',
        bankName: bankAccount.bankName || shop.bankAccount?.bankName || '',
        bankBranch: bankAccount.bankBranch || shop.bankAccount?.bankBranch || '',
      };
    }

    // Handle images - if new images are provided, upload them
    if (Array.isArray(images) && images.length > 0) {
      try {
        const { uploadShopImages } = require('../utils/gcpStorage');
        const imageBuffers = [];
        const existingUrls = [];

        for (const img of images) {
          // If it's already a URL string, keep it
          if (typeof img === 'string' && img.includes('storage.googleapis.com')) {
            existingUrls.push(img);
          } else if (img && typeof img === 'object' && img.uri) {
            // New image - prepare for upload
            // Note: In production, you'd need to convert the image URI to a buffer
            // For now, we'll keep existing images and add new ones
            // This is a simplified version - you may need to handle base64 conversion
            if (img.uri.startsWith('data:')) {
              const base64Data = img.uri.split(',')[1];
              imageBuffers.push({
                buffer: Buffer.from(base64Data, 'base64'),
                mimeType: img.type || img.mimeType || 'image/jpeg',
              });
            } else if (img.uri.startsWith('file://') || img.uri.startsWith('content://')) {
              // Local file - would need to read and convert
              // For now, skip and keep existing images
              console.log('Local image file detected, skipping upload for now');
            }
          }
        }

        // Upload new images if any
        if (imageBuffers.length > 0 && shop.shopId) {
          const uploadedUrls = await uploadShopImages(imageBuffers, shop.shopId);
          shop.images = [...existingUrls, ...uploadedUrls].slice(0, 3); // Max 3 images
        } else {
          // Just keep existing URLs
          shop.images = existingUrls.slice(0, 3);
        }
      } catch (uploadError) {
        console.error('❌ Error uploading images:', uploadError);
        // Continue with update even if image upload fails
      }
    }

    shop.updatedAt = new Date();
    await shop.save();

    console.log(`✅ Owner updated shop info: ${shop.shopId || shop._id}`);

    // Convert image URLs to signed URLs for frontend access
    let shopData = shop.toObject();
    if (shopData.images && Array.isArray(shopData.images) && shopData.images.length > 0) {
      try {
        const { getSignedUrls } = require('../utils/gcpStorage');
        shopData.images = await getSignedUrls(shopData.images);
      } catch (signedUrlError) {
        console.error('❌ Error generating signed URLs for shop images:', signedUrlError);
        // Continue with original URLs if signed URL generation fails
      }
    }

    res.json({
      success: true,
      message: 'Shop updated successfully',
      data: shopData,
    });
  } catch (error) {
    console.error('❌ Error updating shop info:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating shop',
      error: error.message,
    });
  }
});

/**
 * GET /api/shop/:id/delivery-workers
 * Find delivery workers within shop's delivery radius
 */
router.get('/:id/delivery-workers', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const shop = await Shop.findById(id);

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found',
      });
    }

    // Check if shop needs delivery workers
    if (shop.deliveryOption === 'self') {
      return res.json({
        success: true,
        data: [],
        count: 0,
        message: 'Shop does not require delivery workers',
      });
    }

    // Check if shop has coordinates and delivery radius
    if (!shop.coordinates || !shop.coordinates.latitude || !shop.coordinates.longitude) {
      return res.status(400).json({
        success: false,
        message: 'Shop location is not set. Please set shop coordinates first.',
      });
    }

    if (!shop.deliveryRadiusKm || shop.deliveryRadiusKm <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Shop delivery radius is not set. Please set delivery radius first.',
      });
    }

    // Convert radius from km to meters for MongoDB geospatial query
    const radiusInMeters = shop.deliveryRadiusKm * 1000;

    // Find delivery workers within radius
    // MongoDB $near requires coordinates as [longitude, latitude]
    const shopLocation = {
      type: 'Point',
      coordinates: [shop.coordinates.longitude, shop.coordinates.latitude],
    };

    const deliveryWorkers = await User.find({
      'deliveryProfile.isEnabled': true,
      'deliveryProfile.location': {
        $near: {
          $geometry: shopLocation,
          $maxDistance: radiusInMeters,
        },
      },
      isActive: true,
    })
      .select('name email phone photo deliveryProfile')
      .limit(50)
      .lean();

    console.log(
      `✅ Found ${deliveryWorkers.length} delivery workers within ${shop.deliveryRadiusKm}km of shop ${shop.shopId || shop._id}`
    );

    res.json({
      success: true,
      data: deliveryWorkers.map((worker) => ({
        _id: worker._id,
        name: worker.name,
        email: worker.email,
        phone: worker.phone,
        photo: worker.photo,
        deliveryRadiusKm: worker.deliveryProfile?.radiusKm || 5,
        location: worker.deliveryProfile?.location || null,
      })),
      count: deliveryWorkers.length,
      shopRadiusKm: shop.deliveryRadiusKm,
      shopLocation: {
        latitude: shop.coordinates.latitude,
        longitude: shop.coordinates.longitude,
      },
    });
  } catch (error) {
    console.error('❌ Error finding delivery workers:', error);
    res.status(500).json({
      success: false,
      message: 'Error finding delivery workers',
      error: error.message,
    });
  }
});

/**
 * GET /api/shop/:id/menu
 * Get food menu items for a shop (public - everyone can view)
 */
router.get('/:id/menu', async (req, res) => {
  try {
    const { id } = req.params;

    // Try to find shop by _id (ObjectId) or shopId (string)
    let shop;
    if (mongoose.Types.ObjectId.isValid(id) && id.length === 24) {
      // Valid ObjectId format
      shop = await Shop.findById(id);
    } else {
      // Try to find by shopId (string)
      shop = await Shop.findOne({ shopId: id });
    }

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found',
      });
    }

    // Everyone can view menu - no authentication required

    const FoodMenuItem = require('../models/FoodMenuItem');

    const items = await FoodMenuItem.find({
      shop: shop._id,
      isDeleted: { $ne: true },
    })
      .sort({ isAvailable: -1, name: 1 })
      .lean();

    // Convert image paths/URLs to signed URLs so รูปเมนูโหลดได้ (รองรับทั้ง path แบบ shops/xxx/image.jpg และ full GCP URL)
    const { getSignedUrl } = require('../utils/gcpStorage');
    const itemsWithSignedUrls = await Promise.all(
      items.map(async (item) => {
        if (item.image && typeof item.image === 'string' && item.image.trim()) {
          try {
            item.image = await getSignedUrl(item.image);
          } catch (signedUrlError) {
            if (process.env.NODE_ENV !== 'production') {
              console.warn('Menu item image sign failed:', item.image?.substring(0, 50));
            }
          }
        }
        return item;
      })
    );

    res.json({
      success: true,
      data: itemsWithSignedUrls,
      count: itemsWithSignedUrls.length,
    });
  } catch (error) {
    console.error('❌ Error fetching shop menu:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching shop menu',
      error: error.message,
    });
  }
});

/**
 * POST /api/shop/:id/menu
 * Create a new food menu item (owner only)
 */
router.post('/:id/menu', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, description, image, category, type, isAvailable } = req.body;

    // Try to find shop by _id (ObjectId) or shopId (string)
    let shop;
    if (mongoose.Types.ObjectId.isValid(id) && id.length === 24) {
      shop = await Shop.findById(id);
    } else {
      shop = await Shop.findOne({ shopId: id });
    }

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found',
      });
    }

    const userEmail = req.user.email;
    const isOwner =
      (shop.ownerEmail && shop.ownerEmail === userEmail) ||
      (shop.user && shop.user.email && shop.user.email === userEmail);

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only manage your own shop menu.',
      });
    }

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'ชื่อเมนูเป็นข้อมูลบังคับ',
      });
    }

    const priceNum = Number(price);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกราคาที่ถูกต้อง',
      });
    }

    const FoodMenuItem = require('../models/FoodMenuItem');

    const item = new FoodMenuItem({
      shop: shop._id,
      name: name.trim(),
      price: priceNum,
      description: typeof description === 'string' ? description.trim() : '',
      image: typeof image === 'string' ? image.trim() : '',
      category: typeof category === 'string' ? category.trim() : '',
      type: type && ['food', 'dessert', 'drink', 'other'].includes(type) ? type : 'food',
      isAvailable: typeof isAvailable === 'boolean' ? isAvailable : true,
    });

    await item.save();

    res.status(201).json({
      success: true,
      message: 'สร้างเมนูสำเร็จ',
      data: item,
    });
  } catch (error) {
    console.error('❌ Error creating food menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating menu item',
      error: error.message,
    });
  }
});

/**
 * PUT /api/shop/:id/menu/:menuId
 * Update a food menu item (owner only)
 */
router.put('/:id/menu/:menuId', auth, async (req, res) => {
  try {
    const { id, menuId } = req.params;
    const { name, price, description, image, category, type, isAvailable } = req.body;

    // Try to find shop by _id (ObjectId) or shopId (string)
    let shop;
    if (mongoose.Types.ObjectId.isValid(id) && id.length === 24) {
      shop = await Shop.findById(id);
    } else {
      shop = await Shop.findOne({ shopId: id });
    }

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found',
      });
    }

    const userEmail = req.user.email;
    const isOwner =
      (shop.ownerEmail && shop.ownerEmail === userEmail) ||
      (shop.user && shop.user.email && shop.user.email === userEmail);

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only manage your own shop menu.',
      });
    }

    const FoodMenuItem = require('../models/FoodMenuItem');

    const item = await FoodMenuItem.findOne({
      _id: menuId,
      shop: shop._id,
      isDeleted: { $ne: true },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found',
      });
    }

    if (typeof name === 'string' && name.trim()) {
      item.name = name.trim();
    }

    if (price !== undefined && price !== null) {
      const priceNum = Number(price);
      if (Number.isNaN(priceNum) || priceNum < 0) {
        return res.status(400).json({
          success: false,
          message: 'กรุณากรอกราคาที่ถูกต้อง',
        });
      }
      item.price = priceNum;
    }

    if (typeof description === 'string') {
      item.description = description.trim();
    }

    if (typeof image === 'string') {
      item.image = image.trim();
    }

    if (typeof category === 'string') {
      item.category = category.trim();
    }

    if (type && ['food', 'dessert', 'drink', 'other'].includes(type)) {
      item.type = type;
    }

    if (typeof isAvailable === 'boolean') {
      item.isAvailable = isAvailable;
    }

    await item.save();

    // Convert image path/URL to signed URL so client always gets https (same logic as GET menu)
    let itemData = item.toObject ? item.toObject() : item;
    if (itemData.image && typeof itemData.image === 'string' && itemData.image.trim()) {
      try {
        const { getSignedUrl } = require('../utils/gcpStorage');
        itemData.image = await getSignedUrl(itemData.image);
      } catch (signedUrlError) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Menu item image sign failed (PUT):', itemData.image?.substring(0, 50));
        }
      }
    }

    res.json({
      success: true,
      message: 'อัปเดตเมนูสำเร็จ',
      data: itemData,
    });
  } catch (error) {
    console.error('❌ Error updating food menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating menu item',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/shop/:id/menu/:menuId
 * Soft delete a food menu item (owner only)
 */
router.delete('/:id/menu/:menuId', auth, async (req, res) => {
  try {
    const { id, menuId } = req.params;

    // Try to find shop by _id (ObjectId) or shopId (string)
    let shop;
    if (mongoose.Types.ObjectId.isValid(id) && id.length === 24) {
      shop = await Shop.findById(id);
    } else {
      shop = await Shop.findOne({ shopId: id });
    }

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found',
      });
    }

    const userEmail = req.user.email;
    const isOwner =
      (shop.ownerEmail && shop.ownerEmail === userEmail) ||
      (shop.user && shop.user.email && shop.user.email === userEmail);

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only manage your own shop menu.',
      });
    }

    const FoodMenuItem = require('../models/FoodMenuItem');

    const item = await FoodMenuItem.findOne({
      _id: menuId,
      shop: shop._id,
      isDeleted: { $ne: true },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found',
      });
    }

    item.isDeleted = true;
    await item.save();

    res.json({
      success: true,
      message: 'ลบเมนูสำเร็จ',
    });
  } catch (error) {
    console.error('❌ Error deleting food menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting menu item',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/shop/:id
 * Delete a shop and remove images from GCP bucket
 */
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const shopId = req.params.id;
    console.log(`🗑️ Deleting shop: ${shopId}`);

    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    // Delete images from GCP bucket
    if (shop.images && shop.images.length > 0) {
      try {
        const { deleteImage } = require('../utils/gcpStorage');
        const deletePromises = shop.images.map(imageUrl => {
          if (typeof imageUrl === 'string' && imageUrl.includes('storage.googleapis.com')) {
            return deleteImage(imageUrl);
          }
          return Promise.resolve();
        });
        
        await Promise.all(deletePromises);
        console.log(`✅ Deleted ${shop.images.length} images from GCP for shop ${shopId}`);
      } catch (deleteError) {
        console.error('❌ Error deleting images from GCP:', deleteError);
        // Continue with shop deletion even if image deletion fails
      }
    }

    // Delete shop from database
    await Shop.findByIdAndDelete(shopId);
    
    console.log(`✅ Shop ${shopId} deleted successfully`);
    
    res.json({
      success: true,
      message: 'Shop deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting shop:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting shop',
      error: error.message
    });
  }
});

/**
 * POST /api/shop/:id/upload-images
 * Upload new images to GCP and return URLs (separate endpoint to avoid 413 errors)
 */
router.post('/:id/upload-images', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { images } = req.body; // Array of { data: base64String, mimeType: string }

    const shop = await Shop.findById(id);
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found',
      });
    }

    // Only owner (by email) or linked user can upload images
    const userEmail = req.user.email;
    const isOwner =
      (shop.ownerEmail && shop.ownerEmail === userEmail) ||
      (shop.user && shop.user.email && shop.user.email === userEmail);

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only upload images for your own shop.',
      });
    }

    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images provided',
      });
    }

    if (!shop.shopId) {
      return res.status(400).json({
        success: false,
        message: 'Shop must have shopId to upload images',
      });
    }

    try {
      const { uploadShopImages } = require('../utils/gcpStorage');
      const imageBuffers = [];

      for (const img of images) {
        if (!img.data || typeof img.data !== 'string') {
          console.warn('⚠️ Skipping invalid image data');
          continue;
        }

        imageBuffers.push({
          buffer: Buffer.from(img.data, 'base64'),
          mimeType: img.mimeType || 'image/jpeg',
        });
      }

                      if (imageBuffers.length > 0) {
                        const uploadedUrls = await uploadShopImages(imageBuffers, shop.shopId);
                        console.log(`✅ Uploaded ${uploadedUrls.length} images to GCP for shop ${shop.shopId}`);

                        // Convert to signed URLs for frontend access
                        const { getSignedUrls } = require('../utils/gcpStorage');
                        const signedUrls = await getSignedUrls(uploadedUrls);

                        res.json({
                          success: true,
                          urls: signedUrls,
                          count: signedUrls.length,
                        });
                      } else {
        res.status(400).json({
          success: false,
          message: 'No valid images to upload',
        });
      }
    } catch (uploadError) {
      console.error('❌ Error uploading images to GCP:', uploadError);
      res.status(500).json({
        success: false,
        message: 'Error uploading images to GCP',
        error: uploadError.message,
      });
    }
  } catch (error) {
    console.error('❌ Error in upload-images endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing image upload request',
      error: error.message,
    });
  }
});

module.exports = router;