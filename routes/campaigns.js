// backend/routes/campaigns.js - Public API for mobile: list campaigns by shop, join campaign
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { auth } = require('../middleware/auth');
const Campaign = require('../models/Campaign');
const CampaignParticipation = require('../models/CampaignParticipation');
const Shop = require('../models/Shop');

/**
 * Resolve shop identifier to Shop's MongoDB _id (supports both ObjectId and shopId code).
 */
async function resolveShopId(shopIdParam) {
  if (!shopIdParam) return null;
  const str = String(shopIdParam).trim();
  if (/^[a-fA-F0-9]{24}$/.test(str)) {
    const asObjectId = new mongoose.Types.ObjectId(str);
    const shop = await Shop.findById(asObjectId).select('_id').lean();
    return shop ? shop._id : null;
  }
  const shop = await Shop.findOne({ shopId: str }).select('_id').lean();
  return shop ? shop._id : null;
}

/**
 * GET /api/campaigns/shop/:shopId
 * List active campaigns for a shop (status=active, within start/end date).
 * :shopId can be Shop's MongoDB _id or the shop's shopId code (e.g. from ExploreScreen).
 * Use GET /api/campaigns/my?shopId=xxx (with auth) to get current user's participation status.
 */
router.get('/shop/:shopId', async (req, res) => {
  try {
    const shopParam = req.params.shopId;
    const shopObjectId = await resolveShopId(shopParam);
    if (!shopObjectId) {
      console.log('🎯 GET /campaigns/shop/:shopId - shop not found for param:', shopParam);
      return res.json({ success: true, data: [] });
    }

    const now = new Date();

    const campaigns = await Campaign.find({
      shop: shopObjectId,
      status: 'active',
      startDate: { $lte: now },
      $or: [
        { endDate: null },
        { endDate: { $exists: false } },
        { endDate: { $gte: now } }
      ]
    })
      .populate('shop', 'shopName shopId province')
      .sort({ startDate: -1 })
      .lean();

    console.log('🎯 GET /campaigns/shop/:shopId - shop:', shopObjectId.toString(), 'campaigns:', campaigns.length);
    return res.json({
      success: true,
      data: campaigns
    });
  } catch (error) {
    console.error('Campaigns by shop error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/campaigns/my?shopId=xxx
 * Get current user's participations for a shop. Auth required.
 * shopId can be Shop's _id or shopId code.
 */
router.get('/my', auth, async (req, res) => {
  try {
    const { shopId } = req.query;
    if (!shopId) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุ shopId' });
    }
    const shopObjectId = await resolveShopId(shopId);
    if (!shopObjectId) {
      return res.json({ success: true, data: {} });
    }
    const shopIdStr = shopObjectId.toString();
    const participations = await CampaignParticipation.find({
      user: req.user.id
    })
      .populate('campaign')
      .lean();
    const forShop = participations.filter((p) => p.campaign && p.campaign.shop && p.campaign.shop.toString() === shopIdStr);
    const myParticipations = {};
    forShop.forEach((p) => {
      const cid = p.campaign._id.toString();
      myParticipations[cid] = {
        status: p.status,
        completedAt: p.completedAt,
        pointsAwarded: p.pointsAwarded,
        completionCount: p.completionCount,
        lastCompletedDate: p.lastCompletedDate
      };
    });
    return res.json({ success: true, data: myParticipations });
  } catch (error) {
    console.error('Campaign my participations error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/campaigns/:id/join
 * User joins a campaign (creates CampaignParticipation with status=joined). Auth required.
 */
router.post('/:id/join', auth, async (req, res) => {
  try {
    const campaignId = req.params.id;
    const userId = req.user.id;

    const campaign = await Campaign.findById(campaignId).lean();
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'ไม่พบแคมเปญ' });
    }
    if (campaign.status !== 'active') {
      return res.status(400).json({ success: false, message: 'แคมเปญนี้ยังไม่เปิดหรือปิดแล้ว' });
    }
    const now = new Date();
    if (campaign.startDate && new Date(campaign.startDate) > now) {
      return res.status(400).json({ success: false, message: 'แคมเปญยังไม่เริ่ม' });
    }
    if (campaign.endDate && new Date(campaign.endDate) < now) {
      return res.status(400).json({ success: false, message: 'แคมเปญหมดอายุแล้ว' });
    }
    if (campaign.maxParticipants > 0) {
      const joined = await CampaignParticipation.countDocuments({ campaign: campaignId });
      if (joined >= campaign.maxParticipants) {
        return res.status(400).json({ success: false, message: 'แคมเปญนี้เต็มแล้ว' });
      }
    }

    const existing = await CampaignParticipation.findOne({ campaign: campaignId, user: userId });
    if (existing) {
      return res.json({
        success: true,
        message: 'คุณเข้าร่วมแคมเปญนี้แล้ว',
        data: existing
      });
    }

    const participation = await CampaignParticipation.create({
      campaign: campaignId,
      user: userId,
      status: 'joined'
    });

    return res.status(201).json({
      success: true,
      message: 'เข้าร่วมแคมเปญสำเร็จ',
      data: participation
    });
  } catch (error) {
    console.error('Campaign join error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
