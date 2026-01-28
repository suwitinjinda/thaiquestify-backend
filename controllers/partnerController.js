// backend/controllers/partnerController.js
const Shop = require('../models/Shop');
const User = require('../models/User');
const Partner = require('../models/Partner');
const ShopFeeSplitRecord = require('../models/ShopFeeSplitRecord');

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

    // Fetch partner details from Partner model
    const partner = await Partner.findOne({ userId: partnerId })
      .populate('userId', 'name email photo');

    const shops = await Shop.find({ partnerId })
      .select('shopId shopName status registeredAt province')
      .sort({ registeredAt: -1 });

    // Calculate statistics
    const totalShops = shops.length;
    const activeShops = shops.filter(shop => shop.status === 'active').length;
    const pendingShops = shops.filter(shop => shop.status === 'pending').length;

    // Calculate commission from ShopFeeSplitRecord (sum partnerShare)
    const partnerRefId = partner?._id || null;
    const partnerUserId = partnerId; // User._id
    
    // Total commission (all time): sum of partnerShare from ShopFeeSplitRecord
    // Query by partnerRef (preferred) OR partnerId (fallback for old records)
    const matchConditions = [
      { partnerId: partnerUserId, partnerShare: { $gt: 0 } }
    ];
    if (partnerRefId) {
      matchConditions.push({ partnerRef: partnerRefId, partnerShare: { $gt: 0 } });
    }
    const totalCommissionAgg = await ShopFeeSplitRecord.aggregate([
      { $match: { $or: matchConditions } },
      { $group: { _id: null, total: { $sum: '$partnerShare' } } }
    ]);
    const totalCommission = Number(totalCommissionAgg[0]?.total) || 0;

    // Pending commission: use Partner.pendingCommission (สะสมจาก fee splits)
    const pendingCommission = partner?.pendingCommission || 0;

    // Recent shops (last 5)
    const recentShops = shops.slice(0, 5).map(shop => ({
      shopId: shop.shopId,
      shopName: shop.shopName,
      status: shop.status,
      province: shop.province || 'N/A',
      registeredAt: shop.registeredAt
    }));

    // Build partner info from Partner model or fallback to user data
    const partnerInfo = partner ? {
      name: `${partner.personalInfo?.firstName || ''} ${partner.personalInfo?.lastName || ''}`.trim() || partner.userId?.name || req.user.name,
      email: partner.personalInfo?.email || partner.userId?.email || req.user.email,
      partnerCode: partner.partnerCode || req.user.partnerCode,
      personalInfo: partner.personalInfo,
      workingArea: partner.workingArea,
      socialMedia: partner.socialMedia,
      bankAccount: partner.bankAccount,
      additionalInfo: partner.additionalInfo,
      status: partner.status,
    } : {
      name: req.user.name,
      email: req.user.email,
      partnerCode: req.user.partnerCode,
    };

    console.log(`✅ Dashboard data found: ${totalShops} shops, ${activeShops} active`);
    console.log(`✅ Partner info:`, partnerInfo);

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
        partnerInfo
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

// Public (or authenticated) endpoint: get partner info by partnerCode
// Used by shop detail to show partner name & phone from DB
exports.getPartnerInfoByCode = async (req, res) => {
  try {
    const { partnerCode } = req.params;

    if (!partnerCode) {
      return res.status(400).json({
        success: false,
        message: 'partnerCode is required'
      });
    }

    const partner = await Partner.findOne({ partnerCode }).populate('userId', 'name email phone');

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found'
      });
    }

    const nameFromUser = partner.userId?.name;
    const phoneFromUser = partner.userId?.phone;
    const nameFromPersonal = partner.personalInfo
      ? `${partner.personalInfo.firstName} ${partner.personalInfo.lastName}`.trim()
      : null;

    // ให้ใช้ข้อมูลจาก Partner (personalInfo) เป็นหลักก่อน
    const name = nameFromPersonal || nameFromUser || null;
    const phone = partner.personalInfo?.phone || phoneFromUser || null;

    return res.json({
      success: true,
      data: {
        partnerCode: partner.partnerCode,
        name,
        phone
      }
    });
  } catch (error) {
    console.error('❌ Get partner info by code error:', error);
    return res.status(500).json({
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

    // Convert image URLs to signed URLs for frontend access
    let shopData = shop.toObject ? shop.toObject() : shop;
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
      data: shopData
    });

  } catch (error) {
    console.error('❌ Get shop details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update shop status by partner (open/close)
exports.updateShopStatus = async (req, res) => {
  try {
    const { shopId } = req.params; // business shopId (6 digits)
    const { status } = req.body;
    const partnerId = req.user._id;

    const allowedStatuses = ['active', 'suspended'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Allowed values: active, suspended',
      });
    }

    const shop = await Shop.findOne({ shopId, partnerId });
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found',
      });
    }

    shop.status = status;
    shop.updatedAt = new Date();
    await shop.save();

    res.json({
      success: true,
      message: 'Shop status updated successfully',
      data: shop,
    });
  } catch (error) {
    console.error('❌ Partner update shop status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
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

// Manual shop registration (for onsite registration)
// Partner can register shop directly without shop request or user account
exports.registerShopManual = async (req, res) => {
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
      ownerName,
      ownerEmail,
      ownerPhone,
      images,
      shopMode,
      isOpen,
      deliveryOption,
      accountName,
      accountNumber,
      bankName,
      bankBranch
    } = req.body;

    const partnerId = req.user._id;

    // Validate required fields (user and ownerEmail are optional for manual registration)
    if (!shopName || !shopType || !province || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: shopName, shopType, province, phone'
      });
    }

    console.log('🔍 Validating manual shop registration data:', {
      shopName: !!shopName,
      shopType: !!shopType,
      province: !!province,
      phone: !!phone,
      ownerName: !!ownerName,
      ownerEmail: !!ownerEmail
    });

    console.log(`🔄 Manual shop registration for partner: ${req.user.email}`);

    // Get partner code
    const Partner = require('../models/Partner');
    const partner = await Partner.findOne({ userId: partnerId }).select('partnerCode');
    const partnerCode = partner?.partnerCode || req.user.partnerCode || 'PARTNER001';

    // Upload images to GCP if provided
    let uploadedImageUrls = [];
    if (images && images.length > 0) {
      try {
        const { uploadShopImages } = require('../utils/gcpStorage');
        // Convert base64 images to buffers
        const imageBuffers = images.map(img => {
          if (typeof img === 'string' && img.startsWith('data:')) {
            // Base64 data URL
            const base64Data = img.split(',')[1];
            return {
              buffer: Buffer.from(base64Data, 'base64'),
              mimeType: img.match(/data:([^;]+)/)?.[1] || 'image/jpeg'
            };
          } else if (typeof img === 'object' && img.buffer) {
            // Already a buffer object
            return {
              buffer: Buffer.from(img.buffer, 'base64'),
              mimeType: img.mimeType || 'image/jpeg'
            };
          }
          return null;
        }).filter(Boolean);

        if (imageBuffers.length > 0) {
          // Use temporary ID for images (will be updated when approved with shopId)
          const tempShopId = `temp_${Date.now()}_${req.user.id}`;
          uploadedImageUrls = await uploadShopImages(imageBuffers, tempShopId);
          console.log(`✅ Uploaded ${uploadedImageUrls.length} images to GCP for manual shop registration`);
        }
      } catch (uploadError) {
        console.error('❌ Error uploading images to GCP:', uploadError);
        // Continue with shop creation even if image upload fails
      }
    }

    // Create new shop (shopId will be generated when approved)
    const shop = new Shop({
      // shopId: will be generated when admin approves
      partnerId,
      partnerCode,
      shopName,
      ownerEmail: ownerEmail || null, // Optional for manual registration
      shopType,
      province,
      district: district || '',
      address: address || '',
      coordinates: coordinates ? {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude
      } : undefined,
      phone,
      businessHours: businessHours || '',
      description: description || '',
      taxId: taxId || '',
      images: uploadedImageUrls.length > 0 ? uploadedImageUrls : [],
      shopMode: shopMode || 'both',
      isOpen: isOpen !== undefined ? isOpen : true,
      deliveryOption: deliveryOption || 'both',
      bankAccount: {
        accountName: accountName || '',
        accountNumber: accountNumber || '',
        bankName: bankName || '',
        bankBranch: bankBranch || ''
      },
      status: 'pending', // Admin needs to approve
      registeredAt: new Date(),
      // Store owner info in description or additional field if needed
      // For now, ownerName and ownerPhone can be stored in description
      ...(ownerName || ownerPhone ? {
        description: `${description || ''}\n\nOwner: ${ownerName || ''}${ownerPhone ? `, Phone: ${ownerPhone}` : ''}`.trim()
      } : {})
    });

    await shop.save();

    console.log(`✅ Manual shop registered: ${shopName} by partner: ${req.user.email} (Partner Code: ${partnerCode})`);

    res.status(201).json({
      success: true,
      message: 'Shop registered successfully. Waiting for admin approval.',
      data: {
        shopId: shop._id,
        shopName: shop.shopName,
        province: shop.province,
        status: shop.status,
        registeredAt: shop.registeredAt,
        partnerCode: partnerCode
      }
    });

  } catch (error) {
    console.error('❌ Manual shop registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
