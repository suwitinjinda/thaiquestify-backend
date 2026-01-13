// backend/controllers/partnerController.js
const Shop = require('../models/Shop');
const User = require('../models/User');

// Generate unique 6-digit shop number
const generateShopNumber = async () => {
  let shopNumber;
  let isUnique = false;
  
  while (!isUnique) {
    shopNumber = Math.floor(100000 + Math.random() * 900000).toString();
    const existingShop = await Shop.findOne({ shopId: shopNumber });
    if (!existingShop) {
      isUnique = true;
    }
  }
  
  return shopNumber;
};

// Register new shop
exports.registerShop = async (req, res) => {
  try {
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
      coordinates
    } = req.body;

    const partnerId = req.user.id;

    // Validate required fields
    if (!shopName || !shopType || !province || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: shopName, shopType, province, phone'
      });
    }

    // Check if user is partner (has partnerId)
    if (!req.user.partnerId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only partners can register shops.'
      });
    }

    // Generate shop number
    const shopNumber = await generateShopNumber();

    // Create new shop
    const shop = new Shop({
      shopId: shopNumber,
      partnerId,
      partnerCode: req.user.partnerCode || 'PARTNER001', // ใช้จาก user หรือ default
      shopName,
      shopType,
      province,
      district: district || '',
      address: address || '',
      phone,
      businessHours: businessHours || '',
      description: description || '',
      taxId: taxId || '',
      coordinates: coordinates || null,
      status: 'pending',
      registeredAt: new Date()
    });

    await shop.save();

    console.log(`✅ Shop registered: ${shopName} (${shopNumber}) by partner: ${partnerId}`);

    res.status(201).json({
      success: true,
      message: 'Shop registered successfully',
      data: {
        shopId: shop.shopId,
        shopName: shop.shopName,
        province: shop.province,
        status: shop.status,
        registeredAt: shop.registeredAt
      }
    });

  } catch (error) {
    console.error('❌ Shop registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get partner's shops
exports.getPartnerShops = async (req, res) => {
  try {
    const partnerId = req.user.id;

    // Check if user is partner (has partnerId)
    if (!req.user.partnerId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only partners can access shops.'
      });
    }

    const shops = await Shop.find({ partnerId })
      .select('shopId shopName shopType province district status registeredAt approvedAt phone')
      .sort({ registeredAt: -1 });

    // Calculate shop statistics
    const totalShops = shops.length;
    const activeShops = shops.filter(shop => shop.status === 'active').length;
    const pendingShops = shops.filter(shop => shop.status === 'pending').length;

    res.json({
      success: true,
      data: {
        shops,
        statistics: {
          totalShops,
          activeShops,
          pendingShops
        }
      }
    });

  } catch (error) {
    console.error('❌ Get partner shops error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get shop details
exports.getShopDetails = async (req, res) => {
  try {
    const { shopId } = req.params;
    const partnerId = req.user.id;

    const shop = await Shop.findOne({ shopId, partnerId });
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    res.json({
      success: true,
      data: shop
    });

  } catch (error) {
    console.error('❌ Get shop details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Generate shop number endpoint
exports.generateShopNumber = async (req, res) => {
  try {
    const shopNumber = await generateShopNumber();
    
    console.log(`✅ Generated shop number: ${shopNumber}`);
    
    res.json({
      success: true,
      shopNumber
    });
  } catch (error) {
    console.error('❌ Generate shop number error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating shop number'
    });
  }
};

// Get partner dashboard data
exports.getPartnerDashboard = async (req, res) => {
  try {
    const partnerId = req.user.id;

    // Check if user is partner (has partnerId)
    if (!req.user.partnerId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only partners can access dashboard.'
      });
    }

    const shops = await Shop.find({ partnerId })
      .select('shopId shopName status registeredAt')
      .sort({ registeredAt: -1 });

    // Calculate statistics
    const totalShops = shops.length;
    const activeShops = shops.filter(shop => shop.status === 'active').length;
    const pendingShops = shops.filter(shop => shop.status === 'pending').length;

    // Mock commission data (ในอนาคตจะคำนวณจาก transaction จริง)
    const totalCommission = activeShops * 1000; // Mock data
    const pendingCommission = pendingShops * 500; // Mock data

    // Recent shops (last 5)
    const recentShops = shops.slice(0, 5);

    res.json({
      success: true,
      data: {
        statistics: {
          totalShops,
          activeShops,
          pendingShops,
          totalCommission,
          pendingCommission
        },
        recentShops,
        partnerInfo: {
          name: req.user.name,
          partnerCode: req.user.partnerCode,
          email: req.user.email
        }
      }
    });

  } catch (error) {
    console.error('❌ Get partner dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};