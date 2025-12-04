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
      coordinates,
      user,
      ownerEmail
    } = req.body;

    const partnerId = req.user._id;

    // ✅ FIX THE VALIDATION LOGIC
    // The original condition was incorrect: !ownerEmail || user would always be true
    if (!shopName || !shopType || !province || !phone || !user || !ownerEmail) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: shopName, shopType, province, phone, user, ownerEmail'
      });
    }

    console.log('🔍 Validating shop registration data:', {
      shopName: !!shopName,
      shopType: !!shopType,
      province: !!province,
      phone: !!phone,
      user: !!user,
      ownerEmail: !!ownerEmail
    });

    console.log(`🔄 Registering shop for partner: ${req.user.email}`);

    // Generate shop number
    const shopNumber = await generateShopNumber();

    // Create new shop
    const shop = new Shop({
      shopId: shopNumber,
      partnerId,
      partnerCode: req.user.partnerCode || 'PARTNER001',
      shopName,
      user,
      ownerEmail,
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

    console.log(`✅ Shop registered: ${shopName} (${shopNumber}) by partner: ${req.user.email}`);

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
    const partnerId = req.user._id;

    // REMOVED: partner check since partnerAuth middleware handles it

    console.log(`🔄 Fetching shops for partner: ${req.user.email}`);

    const shops = await Shop.find({ partnerId })
      .select('shopId shopName shopType province district status registeredAt approvedAt phone')
      .sort({ registeredAt: -1 });

    // Calculate shop statistics
    const totalShops = shops.length;
    const activeShops = shops.filter(shop => shop.status === 'active').length;
    const pendingShops = shops.filter(shop => shop.status === 'pending').length;

    console.log(`✅ Found ${shops.length} shops for partner`);

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

// Get partner dashboard data
exports.getPartnerDashboard = async (req, res) => {
  try {
    const partnerId = req.user._id;

    // REMOVED: partner check since partnerAuth middleware handles it

    console.log(`🔄 Fetching dashboard for partner: ${req.user.email}, ID: ${partnerId}`);

    const shops = await Shop.find({ partnerId })
      .select('shopId shopName status registeredAt province')
      .sort({ registeredAt: -1 });

    // Calculate statistics
    const totalShops = shops.length;
    const activeShops = shops.filter(shop => shop.status === 'active').length;
    const pendingShops = shops.filter(shop => shop.status === 'pending').length;

    // Mock commission data
    const totalCommission = activeShops * 1000;
    const pendingCommission = pendingShops * 500;

    // Recent shops (last 5)
    const recentShops = shops.slice(0, 5).map(shop => ({
      shopId: shop.shopId,
      shopName: shop.shopName,
      status: shop.status,
      province: shop.province || 'N/A',
      registeredAt: shop.registeredAt
    }));

    console.log(`✅ Dashboard data found: ${totalShops} shops, ${activeShops} active`);

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

// Get shop details
exports.getShopDetails = async (req, res) => {
  try {
    const { shopId } = req.params;
    const partnerId = req.user._id;

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
