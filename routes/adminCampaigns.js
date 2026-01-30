// backend/routes/adminCampaigns.js - แคมเปญส่งเสริมการขาย (Admin only)
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth').adminAuth;
const Campaign = require('../models/Campaign');
const CampaignParticipation = require('../models/CampaignParticipation');
const Shop = require('../models/Shop');
const User = require('../models/User');
const Order = require('../models/Order');
const PointTransaction = require('../models/PointTransaction');

const applyAuth = [auth, adminAuth];

/**
 * GET /api/v2/admin/campaigns
 * List campaigns (filter: shop, status)
 */
router.get('/', applyAuth, async (req, res) => {
  try {
    const { shop, status } = req.query;
    const query = {};
    if (shop) query.shop = shop;
    if (status) query.status = status;

    const campaigns = await Campaign.find(query)
      .populate('shop', 'shopName shopId province status')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    const withCounts = await Promise.all(
      campaigns.map(async (c) => {
        const joined = await CampaignParticipation.countDocuments({ campaign: c._id });
        const completed = await CampaignParticipation.countDocuments({ campaign: c._id, status: 'completed' });
        const ordersWithCampaign = await Order.find({ appliedCampaign: c._id, status: 'completed' }).select('_id').lean();
        const orderIds = ordersWithCampaign.map((o) => o._id);
        let totalPointsPaidToShop = 0;
        if (orderIds.length > 0) {
          const paidResult = await PointTransaction.aggregate([
            { $match: { type: 'campaign_shop', relatedModel: 'Order', relatedId: { $in: orderIds } } },
            { $group: { _id: null, sum: { $sum: '$amount' } } }
          ]);
          totalPointsPaidToShop = paidResult[0]?.sum || 0;
        }
        return {
          ...c,
          participantsJoined: joined,
          participantsCompleted: completed,
          totalPointsGiven: totalPointsPaidToShop
        };
      })
    );

    return res.json({
      success: true,
      data: withCounts
    });
  } catch (error) {
    console.error('Admin campaigns list error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/v2/admin/campaigns
 * Create campaign
 */
router.post('/', applyAuth, async (req, res) => {
  try {
    const { name, description, shopId, pointsPerCompletion, maxParticipants, type, startDate, endDate, maxOrderBaht, pointsType } = req.body;
    if (!name || !shopId) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอก ชื่อแคมเปญ และร้าน (shopId)'
      });
    }
    const ptsType = pointsType === 'equal_to_food_amount' ? 'equal_to_food_amount' : 'fixed';
    if (ptsType === 'fixed' && (pointsPerCompletion == null || Number(pointsPerCompletion) < 1)) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอก Point ต่อครั้ง (อย่างน้อย 1) เมื่อเลือกวิธีให้ Point แบบคงที่'
      });
    }

    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(400).json({ success: false, message: 'ไม่พบร้านที่เลือก' });
    }

    const campaign = await Campaign.create({
      name,
      description: description || '',
      shop: shopId,
      pointsPerCompletion: ptsType === 'fixed' ? Number(pointsPerCompletion) || 10 : 0,
      maxParticipants: Number(maxParticipants) || 0,
      type: type === 'daily' ? 'daily' : 'one_time',
      status: 'active',
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : undefined,
      maxOrderBaht: Number(maxOrderBaht) || 0,
      pointsType: ptsType,
      createdBy: req.user.id
    });

    const populated = await Campaign.findById(campaign._id)
      .populate('shop', 'shopName shopId province')
      .populate('createdBy', 'name email')
      .lean();

    return res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.error('Admin create campaign error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/v2/admin/campaigns/:id
 * Get one campaign
 */
router.get('/:id', applyAuth, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('shop', 'shopName shopId province address phone')
      .populate('createdBy', 'name email')
      .lean();
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'ไม่พบแคมเปญ' });
    }
    return res.json({ success: true, data: campaign });
  } catch (error) {
    console.error('Admin get campaign error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/v2/admin/campaigns/:id
 * Update campaign (name, description, status, dates, etc.)
 */
router.put('/:id', applyAuth, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'ไม่พบแคมเปญ' });
    }

    const allowed = ['name', 'description', 'pointsPerCompletion', 'maxParticipants', 'type', 'status', 'startDate', 'endDate', 'maxOrderBaht', 'pointsType'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        if (key === 'startDate' || key === 'endDate') {
          campaign[key] = req.body[key] ? new Date(req.body[key]) : undefined;
        } else if (key === 'maxOrderBaht') {
          campaign[key] = Math.max(0, Number(req.body[key]) || 0);
        } else if (key === 'pointsType') {
          campaign[key] = req.body[key] === 'equal_to_food_amount' ? 'equal_to_food_amount' : 'fixed';
        } else {
          campaign[key] = req.body[key];
        }
      }
    }
    if (campaign.pointsType === 'fixed' && (campaign.pointsPerCompletion == null || campaign.pointsPerCompletion < 1)) {
      campaign.pointsPerCompletion = 10;
    }
    await campaign.save();

    const populated = await Campaign.findById(campaign._id)
      .populate('shop', 'shopName shopId province')
      .populate('createdBy', 'name email')
      .lean();
    return res.json({ success: true, data: populated });
  } catch (error) {
    console.error('Admin update campaign error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /api/v2/admin/campaigns/:id
 * Delete campaign and its participations (cascade).
 */
router.delete('/:id', applyAuth, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'ไม่พบแคมเปญ' });
    }
    await CampaignParticipation.deleteMany({ campaign: req.params.id });
    await Campaign.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'ลบแคมเปญเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Admin delete campaign error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/v2/admin/campaigns/:id/activity
 * Dashboard: participations, stats
 */
router.get('/:id/activity', applyAuth, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('shop', 'shopName shopId name province')
      .lean();
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'ไม่พบแคมเปญ' });
    }

    const participantsJoined = await CampaignParticipation.countDocuments({ campaign: req.params.id });
    const participantsCompleted = await CampaignParticipation.countDocuments({ campaign: req.params.id, status: 'completed' });
    const totalPointsResult = await CampaignParticipation.aggregate([
      { $match: { campaign: req.params.id, status: 'completed' } },
      { $group: { _id: null, sum: { $sum: '$pointsAwarded' } } }
    ]);
    const totalPointsFromParticipations = totalPointsResult[0]?.sum || 0;

    // Real total: sum of PointTransaction (type campaign_shop) for orders that used this campaign = platform pay to shop (wait to withdraw)
    const ordersWithCampaign = await Order.find({ appliedCampaign: req.params.id, status: 'completed' }).select('_id').lean();
    const orderIds = ordersWithCampaign.map((o) => o._id);
    let totalPointsPaidToShop = 0;
    if (orderIds.length > 0) {
      const paidResult = await PointTransaction.aggregate([
        { $match: { type: 'campaign_shop', relatedModel: 'Order', relatedId: { $in: orderIds } } },
        { $group: { _id: null, sum: { $sum: '$amount' } } }
      ]);
      totalPointsPaidToShop = paidResult[0]?.sum || 0;
    }

    const participations = await CampaignParticipation.find({ campaign: req.params.id })
      .populate('user', 'name email')
      .sort({ updatedAt: -1 })
      .limit(100)
      .lean();

    return res.json({
      success: true,
      data: {
        campaign,
        stats: {
          participantsJoined,
          participantsCompleted,
          totalPointsGiven: totalPointsPaidToShop,
          totalPointsFromParticipations,
          totalPointsPaidToShop
        },
        participations
      }
    });
  } catch (error) {
    console.error('Admin campaign activity error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
