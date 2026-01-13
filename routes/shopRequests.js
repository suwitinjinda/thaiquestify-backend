// backend/routes/shopRequests.js
const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const ShopRequest = require('../models/ShopRequest');
const Shop = require('../models/Shop');
const User = require('../models/User');
const { partnerAuth } = require('../middleware/partnerAuth');

/**
 * POST /api/shop-requests
 * Submit a shop request (user wants to join as shop)
 * Automatically assigns to a random partner in the same province
 */
router.post('/', auth, async (req, res) => {
  try {
    const { name, email, tel, province } = req.body;

    // Validate required fields
    if (!name || !email || !tel || !province) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, tel, and province'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Find available partners in the same province
    const Partner = require('../models/Partner');
    const User = require('../models/User');
    
    // Get all approved partners in the same province
    const partners = await Partner.find({
      status: 'approved',
      'workingArea.province': province
    }).populate('userId', '_id');

    if (partners.length === 0) {
      // No partners in this province, create request without assignment
      const shopRequest = new ShopRequest({
        name,
        email: email.toLowerCase(),
        tel,
        province,
        userId: req.user.id,
        status: 'pending'
      });
      await shopRequest.save();

      return res.json({
        success: true,
        message: 'คำขอเข้าร่วมร้านค้าถูกส่งเรียบร้อยแล้ว แต่ยังไม่มี Partner ในจังหวัดนี้',
        data: shopRequest
      });
    }

    // If only 1 partner, assign directly
    let assignedPartner = null;
    if (partners.length === 1) {
      assignedPartner = partners[0].userId._id;
    } else {
      // Multiple partners: find one without active cooldown
      const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
      
      // Get all partner IDs
      const partnerIds = partners.map(p => p.userId._id);
      
      // Find partners who are NOT in cooldown (no recent assignments in last 4 hours)
      const requestsInCooldown = await ShopRequest.find({
        assignedPartnerId: { $in: partnerIds },
        cooldownUntil: { $gt: new Date() }
      }).distinct('assignedPartnerId');
      
      // Get available partners (not in cooldown)
      const availablePartnerIds = partnerIds.filter(
        pid => !requestsInCooldown.some(cpid => cpid.toString() === pid.toString())
      );
      
      if (availablePartnerIds.length > 0) {
        // Random select from available partners
        const randomIndex = Math.floor(Math.random() * availablePartnerIds.length);
        assignedPartner = availablePartnerIds[randomIndex];
      } else {
        // All partners in cooldown, find the one with oldest cooldown (circular assignment)
        const oldestCooldown = await ShopRequest.findOne({
          assignedPartnerId: { $in: partnerIds },
          cooldownUntil: { $gt: new Date() }
        }).sort({ cooldownUntil: 1 }).select('assignedPartnerId');
        
        if (oldestCooldown) {
          assignedPartner = oldestCooldown.assignedPartnerId;
        } else {
          // Fallback: random select
          const randomIndex = Math.floor(Math.random() * partnerIds.length);
          assignedPartner = partnerIds[randomIndex];
        }
      }
    }

    // Calculate cooldown (4 hours from now)
    const cooldownUntil = new Date(Date.now() + 4 * 60 * 60 * 1000);

    // Create shop request with assignment
    const shopRequest = new ShopRequest({
      name,
      email: email.toLowerCase(),
      tel,
      province,
      userId: req.user.id,
      status: 'pending',
      assignedPartnerId: assignedPartner,
      assignedAt: new Date(),
      cooldownUntil: cooldownUntil
    });

    await shopRequest.save();

    console.log(`✅ Shop request created by user ${req.user.id}, assigned to partner ${assignedPartner}`);

    res.json({
      success: true,
      message: 'คำขอเข้าร่วมร้านค้าถูกส่งเรียบร้อยแล้ว Partner จะติดต่อกลับภายหลัง',
      data: shopRequest
    });
  } catch (error) {
    console.error('Error creating shop request:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/shop-requests/partner
 * Get shop requests for partner (partner sees pending requests from same province)
 * Admin can see all requests
 */
router.get('/partner', auth, async (req, res) => {
  try {
    const { status } = req.query;
    const isAdmin = req.user.userType === 'admin';
    const isPartner = req.user.partnerId;

    // Admin can see all requests
    if (isAdmin) {
      const query = status ? { status } : {};
      const shopRequests = await ShopRequest.find(query)
        .populate('userId', 'name email photo')
        .populate('partnerId', 'name email')
        .sort({ createdAt: -1 })
        .lean();

      return res.json({
        success: true,
        data: shopRequests
      });
    }

    // Partner sees requests from same province
    if (!isPartner) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Partner privileges required.'
      });
    }

    // Get partner's province from Partner model
    const Partner = require('../models/Partner');
    const partner = await Partner.findOne({ userId: req.user.id }).select('workingArea.province');
    
    if (!partner || !partner.workingArea?.province) {
      return res.json({
        success: true,
        data: [],
        message: 'Partner province not set. Please update your profile.'
      });
    }

    const partnerProvince = partner.workingArea.province;

    // Check for requests that have passed cooldown and need reassignment
    const now = new Date();
    const expiredCooldowns = await ShopRequest.find({
      province: partnerProvince,
      status: 'pending',
      cooldownUntil: { $lt: now },
      assignedPartnerId: { $ne: null }
    });

    // Reassign expired cooldown requests
    if (expiredCooldowns.length > 0) {
      const partners = await Partner.find({
        status: 'approved',
        'workingArea.province': partnerProvince
      }).populate('userId', '_id');

      if (partners.length > 1) {
        const partnerIds = partners.map(p => p.userId._id);
        
        for (const request of expiredCooldowns) {
          // Find next available partner (not the current assigned one)
          const otherPartners = partnerIds.filter(
            pid => pid.toString() !== request.assignedPartnerId.toString()
          );
          
          if (otherPartners.length > 0) {
            // Check which partners are not in cooldown
            const requestsInCooldown = await ShopRequest.find({
              assignedPartnerId: { $in: otherPartners },
              cooldownUntil: { $gt: now }
            }).distinct('assignedPartnerId');
            
            const availablePartners = otherPartners.filter(
              pid => !requestsInCooldown.some(cpid => cpid.toString() === pid.toString())
            );
            
            if (availablePartners.length > 0) {
              const randomIndex = Math.floor(Math.random() * availablePartners.length);
              request.assignedPartnerId = availablePartners[randomIndex];
            } else {
              // All in cooldown, use circular assignment
              const oldestCooldown = await ShopRequest.findOne({
                assignedPartnerId: { $in: otherPartners },
                cooldownUntil: { $gt: now }
              }).sort({ cooldownUntil: 1 }).select('assignedPartnerId');
              
              if (oldestCooldown) {
                request.assignedPartnerId = oldestCooldown.assignedPartnerId;
              } else {
                // Fallback: random from other partners
                const randomIndex = Math.floor(Math.random() * otherPartners.length);
                request.assignedPartnerId = otherPartners[randomIndex];
              }
            }
            
            request.assignedAt = new Date();
            request.cooldownUntil = new Date(Date.now() + 4 * 60 * 60 * 1000);
            await request.save();
          }
        }
      }
    }

    const query = {
      province: partnerProvince
    };

    if (status) {
      query.status = status;
    } else {
      // Show pending requests:
      // 1. Assigned to this partner
      // 2. Not yet assigned (assignedPartnerId is null) - to show "กำลังรอการมอบหมาย"
      // 3. Contacted by this partner
      query.$or = [
        { status: 'pending', assignedPartnerId: req.user.id },
        { status: 'pending', assignedPartnerId: null },
        { status: 'contacted', partnerId: req.user.id }
      ];
    }

    const shopRequests = await ShopRequest.find(query)
      .populate('userId', 'name email photo')
      .populate('assignedPartnerId', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: shopRequests
    });
  } catch (error) {
    console.error('Error fetching shop requests:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * PUT /api/shop-requests/:id/contact
 * Partner contacts the user (marks request as contacted)
 */
router.put('/:id/contact', auth, partnerAuth, async (req, res) => {
  try {
    const { notes } = req.body;

    const shopRequest = await ShopRequest.findById(req.params.id);
    if (!shopRequest) {
      return res.status(404).json({
        success: false,
        message: 'Shop request not found'
      });
    }

    if (shopRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Shop request is already ${shopRequest.status}`
      });
    }

    shopRequest.status = 'contacted';
    shopRequest.partnerId = req.user.id;
    shopRequest.contactedAt = new Date();
    if (notes) {
      shopRequest.notes = notes;
    }

    await shopRequest.save();

    console.log(`✅ Partner ${req.user.id} contacted shop request ${req.params.id}`);

    res.json({
      success: true,
      message: 'Marked as contacted',
      data: shopRequest
    });
  } catch (error) {
    console.error('Error updating shop request:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/shop-requests/:id/register-shop
 * Partner registers shop from the request
 */
router.post('/:id/register-shop', auth, partnerAuth, async (req, res) => {
  try {
    const {
      shopName,
      shopType,
      province,
      district,
      phone,
      businessHours,
      description,
      taxId,
      address: shopAddress,
      coordinates,
      images
    } = req.body;

    const shopRequest = await ShopRequest.findById(req.params.id);
    if (!shopRequest) {
      return res.status(404).json({
        success: false,
        message: 'Shop request not found'
      });
    }

    if (shopRequest.status === 'registered') {
      return res.status(400).json({
        success: false,
        message: 'Shop has already been registered from this request'
      });
    }

    // Validate required fields
    if (!shopName || !shopType || !province || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide shopName, shopType, province, and phone'
      });
    }

    // Shop ID will be generated when admin approves

    // Get partner code
    const partner = await User.findById(req.user.id).select('partnerCode');
    if (!partner || !partner.partnerCode) {
      return res.status(400).json({
        success: false,
        message: 'Partner code not found'
      });
    }

    // Create shop (shopId will be generated when approved)
    const shop = new Shop({
      // shopId: shopNumber, // Will be generated when approved
      partnerId: req.user.id,
      partnerCode: partner.partnerCode,
      userId: shopRequest.userId,
      ownerEmail: shopRequest.email,
      shopName,
      shopType,
      province: shopRequest.province || province,
      district: district || '',
      address: shopAddress || '',
      coordinates: coordinates ? {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude
      } : undefined,
      phone: phone || shopRequest.tel,
      businessHours: businessHours || '',
      description: description || '',
      taxId: taxId || '',
      images: images || [], // Will be uploaded to GCP when approved
      status: 'pending' // Admin needs to approve
    });

    await shop.save();

    // Update shop request
    shopRequest.status = 'registered';
    shopRequest.partnerId = req.user.id;
    shopRequest.shopId = shop._id;
    shopRequest.registeredAt = new Date();
    // Clear cooldown when registered
    shopRequest.cooldownUntil = null;
    await shopRequest.save();

    console.log(`✅ Shop registered from request ${req.params.id} by partner ${req.user.id}`);

    res.json({
      success: true,
      message: 'Shop registered successfully. Waiting for admin approval.',
      data: {
        shop,
        shopRequest
      }
    });
  } catch (error) {
    console.error('Error registering shop:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/shop-requests/admin
 * Get all shop requests (admin view)
 */
router.get('/admin', auth, adminAuth, async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};

    const shopRequests = await ShopRequest.find(query)
      .populate('userId', 'name email photo')
      .populate('partnerId', 'name email photo')
      .populate('assignedPartnerId', 'name email')
      .populate('shopId', 'shopName shopId status')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: shopRequests
    });
  } catch (error) {
    console.error('Error fetching shop requests:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * DELETE /api/shop-requests/:id
 * Delete a shop request (admin only)
 */
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const shopRequest = await ShopRequest.findById(req.params.id);
    
    if (!shopRequest) {
      return res.status(404).json({
        success: false,
        message: 'Shop request not found'
      });
    }

    await ShopRequest.findByIdAndDelete(req.params.id);

    console.log(`✅ Shop request ${req.params.id} deleted by admin ${req.user.id}`);

    res.json({
      success: true,
      message: 'Shop request deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting shop request:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * DELETE /api/shop-requests/admin/cleanup
 * Delete old unassigned requests (admin only)
 */
router.delete('/admin/cleanup', auth, adminAuth, async (req, res) => {
  try {
    const { daysOld = 30 } = req.query; // Default: delete requests older than 30 days
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

    // Delete pending requests that are:
    // 1. Not assigned (assignedPartnerId is null)
    // 2. Older than cutoffDate
    // 3. Status is 'pending'
    const result = await ShopRequest.deleteMany({
      status: 'pending',
      assignedPartnerId: null,
      createdAt: { $lt: cutoffDate }
    });

    console.log(`✅ Deleted ${result.deletedCount} old unassigned shop requests`);

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} old unassigned requests`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error cleaning up shop requests:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
