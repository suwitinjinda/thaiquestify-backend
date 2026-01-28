// backend/routes/partners.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const partnerController = require('../controllers/partnerController');
const Partner = require('../models/Partner');
const User = require('../models/User');
const ShopFeeSplitRecord = require('../models/ShopFeeSplitRecord');
const RewardRedemption = require('../models/RewardRedemption');

// Partner Registration Route (requires auth)
router.post('/register', auth, async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User authentication required' });
    }

    // Check if user already has a partner registration
    const existingPartner = await Partner.findOne({ userId });
    if (existingPartner) {
      return res.status(400).json({ 
        success: false, 
        message: 'You already have a partner registration. Status: ' + existingPartner.status 
      });
    }

    // Get user info for auto-fill
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Validate ID Card (13 digits)
    if (!/^\d{13}$/.test(req.body.personalInfo?.idCard)) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID Card must be exactly 13 digits' 
      });
    }

    // Create partner registration
    const partnerData = {
      userId,
      status: 'pending',
      personalInfo: {
        firstName: req.body.personalInfo.firstName,
        lastName: req.body.personalInfo.lastName,
        email: req.body.personalInfo.email || user.email,
        phone: req.body.personalInfo.phone || user.phone,
        idCard: req.body.personalInfo.idCard
      },
      workingArea: {
        province: req.body.workingArea.province,
        district: req.body.workingArea.district,
        subdistrict: req.body.workingArea.subdistrict || ''
      },
      socialMedia: {
        facebook: req.body.socialMedia?.facebook || '',
        instagram: req.body.socialMedia?.instagram || '',
        tiktok: req.body.socialMedia?.tiktok || user.integrations?.tiktok?.username || '',
        line: req.body.socialMedia?.line || '',
        linkedin: req.body.socialMedia?.linkedin || ''
      },
      bankAccount: {
        bankName: req.body.bankAccount.bankName,
        accountNumber: req.body.bankAccount.accountNumber,
        accountName: req.body.bankAccount.accountName
      },
      additionalInfo: {
        reason: req.body.additionalInfo?.reason || ''
      }
    };

    const partner = new Partner(partnerData);
    await partner.save();

    res.json({
      success: true,
      message: 'Partner registration submitted successfully. Waiting for admin approval.',
      data: {
        partnerId: partner._id,
        status: partner.status
      }
    });
  } catch (error) {
    console.error('Partner registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to submit partner registration' 
    });
  }
});

// Get partner registration status
router.get('/registration-status', auth, async (req, res) => {
  try {
    const partner = await Partner.findOne({ userId: req.user.id });
    if (!partner) {
      return res.json({ success: true, data: null });
    }
    res.json({ success: true, data: partner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Apply auth middleware to partner-protected routes
router.use(auth);

// Public-like info endpoint (still requires auth from app)
router.get('/info/:partnerCode', partnerController.getPartnerInfoByCode);

// Shop registration routes
router.post('/shops/register', partnerController.registerShop);
router.post('/shops/register-manual', partnerController.registerShopManual); // Manual registration for onsite
router.get('/shops', partnerController.getPartnerShops);
router.get('/shops/:shopId', partnerController.getShopDetails);
router.put('/shops/:shopId/status', partnerController.updateShopStatus);
router.post('/shops/generate-number', partnerController.generateShopNumber);

// Partner dashboard statistics
router.get('/dashboard', partnerController.getPartnerDashboard);

// Update partner information
router.put('/me', auth, async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'User authentication required' 
      });
    }

    // Find partner by userId
    const partner = await Partner.findOne({ userId });
    
    if (!partner) {
      return res.status(404).json({ 
        success: false, 
        message: 'Partner not found' 
      });
    }

    // Update partner information
    if (req.body.personalInfo) {
      partner.personalInfo = {
        ...partner.personalInfo,
        ...req.body.personalInfo,
      };
    }

    if (req.body.workingArea) {
      partner.workingArea = {
        ...partner.workingArea,
        ...req.body.workingArea,
      };
    }

    if (req.body.socialMedia) {
      partner.socialMedia = {
        ...partner.socialMedia,
        ...req.body.socialMedia,
      };
    }

    if (req.body.bankAccount) {
      partner.bankAccount = {
        ...partner.bankAccount,
        ...req.body.bankAccount,
      };
    }

    if (req.body.additionalInfo) {
      partner.additionalInfo = {
        ...partner.additionalInfo,
        ...req.body.additionalInfo,
      };
    }

    await partner.save();

    // Populate and return updated partner
    const updatedPartner = await Partner.findById(partner._id)
      .populate('userId', 'name email photo')
      .lean();

    console.log(`✅ Partner ${partner._id} updated by user ${userId}`);

    res.json({
      success: true,
      message: 'Partner information updated successfully',
      data: updatedPartner
    });
  } catch (error) {
    console.error('❌ Error updating partner:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to update partner information' 
    });
  }
});

/**
 * GET /api/v2/partner/commission-history
 * Get partner's commission history from ShopFeeSplitRecord
 */
router.get('/commission-history', auth, async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'User authentication required' 
      });
    }

    // Check if user is partner
    if (!req.user.partnerId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Partner privileges required.'
      });
    }

    // Find partner document
    const partner = await Partner.findOne({ userId });
    const partnerRefId = partner?._id || null;

    // Query ShopFeeSplitRecord for this partner
    const matchConditions = [
      { partnerId: userId, partnerShare: { $gt: 0 } }
    ];
    if (partnerRefId) {
      matchConditions.push({ partnerRef: partnerRefId, partnerShare: { $gt: 0 } });
    }

    const commissionRecords = await ShopFeeSplitRecord.find({ $or: matchConditions })
      .populate('shop', 'shopName shopId')
      .populate('order', 'orderNumber')
      .sort({ createdAt: -1 })
      .lean();

    // Format commission records with shopName and orderNumber
    const formattedRecords = commissionRecords.map(record => ({
      ...record,
      shopName: record.shop?.shopName || record.shopName || '',
      orderNumber: record.order?.orderNumber || record.orderNumber || ''
    }));

    res.json({
      success: true,
      data: formattedRecords
    });
  } catch (error) {
    console.error('❌ Error fetching partner commission history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch commission history',
      error: error.message
    });
  }
});

/**
 * GET /api/partners/reward-history
 * Get partner's reward history from RewardRedemption
 */
router.get('/reward-history', auth, async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'User authentication required' 
      });
    }

    // Check if user is partner
    if (!req.user.partnerId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Partner privileges required.'
      });
    }

    // Query RewardRedemption for this partner
    const rewardRecords = await RewardRedemption.find({ user: userId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: rewardRecords
    });
  } catch (error) {
    console.error('❌ Error fetching partner reward history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reward history',
      error: error.message
    });
  }
});

module.exports = router;