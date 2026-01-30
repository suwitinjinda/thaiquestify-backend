// services/campaignCompletionService.js
// เมื่อออเดอร์สถานะเป็น completed ให้ตรวจสอบแคมเปญที่ user เข้าร่วม และทำครบตามเงื่อนไข (ยอดอาหาร <= maxOrderBaht)

const Campaign = require('../models/Campaign');
const CampaignParticipation = require('../models/CampaignParticipation');
const Order = require('../models/Order');
const Shop = require('../models/Shop');
const User = require('../models/User');
const PointTransaction = require('../models/PointTransaction');

/**
 * Process campaign completions when an order is completed.
 * - ยอดอาหาร = order.subtotal (ไม่รวมค่าส่ง)
 * - เฉพาะ user ที่เข้าร่วมแคมเปญ (status=joined) และแคมเปญ active ภายในวัน
 * - ถ้า maxOrderBaht = 0 หรือ subtotal <= maxOrderBaht → นับว่าทำครบ
 * - one_time: ตั้ง status = completed, pointsAwarded ตาม pointsType
 * - daily: ทำได้ครั้งเดียวต่อวัน (เปรียบเทียบตามปฏิทินไทย UTC+7)
 * @param {Object} order - Order doc with user, shop, subtotal (food only)
 */
const THAI_UTC_OFFSET_MS = 7 * 60 * 60 * 1000;
function getThaiDateString(date) {
  const d = new Date(date);
  const thai = new Date(d.getTime() + THAI_UTC_OFFSET_MS);
  return thai.toISOString().slice(0, 10);
}
function isSameCalendarDay(date1, date2) {
  if (!date1 || !date2) return false;
  return getThaiDateString(date1) === getThaiDateString(date2);
}

async function processCampaignCompletionsForOrder(order) {
  if (!order || !order.user || !order.shop || order.subtotal == null) {
    return;
  }
  const userId = order.user._id ? order.user._id.toString() : order.user.toString();
  const shopId = order.shop._id ? order.shop._id.toString() : order.shop.toString();
  const foodSubtotal = Number(order.subtotal) || 0;

  const applied = [];

  try {
    const participations = await CampaignParticipation.find({ user: userId })
      .populate('campaign')
      .lean();

    const now = new Date();
    for (const p of participations) {
      const campaign = p.campaign;
      if (!campaign || !campaign.shop) continue;
      const campaignShopId = campaign.shop._id ? campaign.shop._id.toString() : campaign.shop.toString();
      if (campaignShopId !== shopId) continue;
      if (campaign.status !== 'active') continue;
      if (campaign.startDate && new Date(campaign.startDate) > now) continue;
      if (campaign.endDate && new Date(campaign.endDate) < now) continue;

      const maxOrderBaht = Number(campaign.maxOrderBaht) || 0;
      if (maxOrderBaht > 0 && foodSubtotal > maxOrderBaht) continue;

      const pointsType = campaign.pointsType === 'equal_to_food_amount' ? 'equal_to_food_amount' : 'fixed';
      const pointsThisCompletion = pointsType === 'equal_to_food_amount'
        ? Math.round(foodSubtotal)
        : (Number(campaign.pointsPerCompletion) || 0);

      const participationDoc = await CampaignParticipation.findById(p._id);
      if (!participationDoc) continue;

      if (campaign.type === 'daily') {
        if (participationDoc.lastCompletedDate && isSameCalendarDay(participationDoc.lastCompletedDate, now)) {
          continue;
        }
        participationDoc.completionCount = (participationDoc.completionCount || 0) + 1;
        participationDoc.lastCompletedDate = now;
        participationDoc.pointsAwarded = (participationDoc.pointsAwarded || 0) + pointsThisCompletion;
        participationDoc.completedAt = now;
        if (participationDoc.status !== 'completed') participationDoc.status = 'completed';
        await participationDoc.save();
        applied.push({
          campaign: campaign._id,
          campaignParticipation: participationDoc._id,
          pointsAwarded: pointsThisCompletion,
        });
      } else {
        if (participationDoc.status === 'completed') continue;
        participationDoc.status = 'completed';
        participationDoc.completedAt = now;
        participationDoc.pointsAwarded = pointsThisCompletion;
        await participationDoc.save();
        applied.push({
          campaign: campaign._id,
          campaignParticipation: participationDoc._id,
          pointsAwarded: pointsThisCompletion,
        });
      }
    }

    if (applied.length > 0 && order._id) {
      await Order.findByIdAndUpdate(order._id, { campaignsApplied: applied });
    }

    // Pay points to shop equal to food cost when order used campaign; MUST record in PointTransaction
    const campaignDiscountAmount = Number(order.campaignDiscountAmount) || 0;
    if (order.appliedCampaign && campaignDiscountAmount > 0 && order._id) {
      try {
        const shopDoc = await Shop.findById(shopId).select('partnerId user').lean();
        const ownerId = shopDoc?.user || shopDoc?.partnerId;
        if (ownerId) {
          const owner = await User.findById(ownerId);
          if (owner) {
            const pointsToAdd = Math.round(campaignDiscountAmount);
            owner.points = (owner.points || 0) + pointsToAdd;
            await owner.save();
            // Required: add to PointTransaction for audit and point history
            await PointTransaction.create({
              userId: owner._id,
              type: 'campaign_shop',
              amount: pointsToAdd,
              description: `แคมเปญ: แพลตฟอร์มจ่าย Point ให้ร้านเท่ากับยอดอาหาร (คำสั่งซื้อที่ใช้แคมเปญ)`,
              relatedId: order._id,
              relatedModel: 'Order',
              remainingPoints: owner.points,
              status: 'completed',
            });
          }
        }
      } catch (payErr) {
        console.error('Campaign shop points payout error:', payErr);
      }
    }
  } catch (err) {
    console.error('Campaign completion processing error:', err);
  }
}

module.exports = { processCampaignCompletionsForOrder };
