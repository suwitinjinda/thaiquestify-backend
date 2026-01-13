// backend/routes/partners.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const partnerController = require('../controllers/partnerController');
const Partner = require('../models/Partner');
const User = require('../models/User');

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

// Apply auth middleware to shop routes
router.use(auth);

// Shop registration routes
router.post('/shops/register', partnerController.registerShop);
router.get('/shops', partnerController.getPartnerShops);
router.get('/shops/:shopId', partnerController.getShopDetails);
router.post('/shops/generate-number', partnerController.generateShopNumber);

// Partner dashboard statistics
router.get('/dashboard', partnerController.getPartnerDashboard);

module.exports = router;