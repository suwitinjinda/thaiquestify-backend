// backend/routes/shopRequests.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
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
    }).populate('userId', '_id name email');

    console.log(`🔍 Found ${partners.length} partners in province: ${province}`);

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

      console.log(`⚠️ No partners in ${province}, created request without assignment`);

      return res.json({
        success: true,
        message: 'คำขอเข้าร่วมร้านค้าถูกส่งเรียบร้อยแล้ว แต่ยังไม่มี Partner ในจังหวัดนี้',
        data: shopRequest
      });
    }

    // NEW LOGIC: Assign to partner with least shops (if equal, random)
    const Shop = require('../models/Shop');

    // Get all partner info with shop counts
    const partnerInfoWithShopCounts = await Promise.all(
      partners.map(async (p) => {
        const userId = p.userId?._id || p.userId;
        if (!userId) return null;

        // Count active shops for this partner
        const shopCount = await Shop.countDocuments({
          partnerId: userId,
          status: 'active'
        });

        return {
          userId: userId.toString(),
          partnerCode: p.partnerCode || null,
          shopCount: shopCount
        };
      })
    );

    // Filter out null entries
    const validPartners = partnerInfoWithShopCounts.filter(p => p !== null);

    console.log(`🔍 Partner shop counts:`, validPartners.map(p => ({
      userId: p.userId,
      partnerCode: p.partnerCode || 'N/A',
      shopCount: p.shopCount
    })));

    let assignedPartner = null;
    let assignedPartnerCode = null;

    if (validPartners.length === 0) {
      // No valid partners (shouldn't happen, but handle gracefully)
      console.log(`⚠️ No valid partners found`);
    } else if (validPartners.length === 1) {
      // Only 1 partner
      assignedPartner = validPartners[0].userId;
      assignedPartnerCode = validPartners[0].partnerCode;
      console.log(`✅ Only 1 partner, assigning directly: ${assignedPartner} (partnerCode: ${assignedPartnerCode || 'N/A'}, shops: ${validPartners[0].shopCount})`);
    } else {
      // Multiple partners: find the one with least shops
      const minShopCount = Math.min(...validPartners.map(p => p.shopCount));
      const partnersWithMinShops = validPartners.filter(p => p.shopCount === minShopCount);

      console.log(`🔍 Partners with minimum shop count (${minShopCount}):`, partnersWithMinShops.length);

      // If multiple partners have the same minimum shop count, random select
      if (partnersWithMinShops.length > 0) {
        const randomIndex = Math.floor(Math.random() * partnersWithMinShops.length);
        const selectedPartner = partnersWithMinShops[randomIndex];
        assignedPartner = selectedPartner.userId;
        assignedPartnerCode = selectedPartner.partnerCode;
        console.log(`✅ Selected partner with least shops (${selectedPartner.shopCount}): ${assignedPartner} (partnerCode: ${assignedPartnerCode || 'N/A'}) - random from ${partnersWithMinShops.length} candidates`);
      } else {
        // Fallback: random select (shouldn't happen)
        const randomIndex = Math.floor(Math.random() * validPartners.length);
        assignedPartner = validPartners[randomIndex].userId;
        assignedPartnerCode = validPartners[randomIndex].partnerCode;
        console.log(`⚠️ Fallback: randomly selected partner: ${assignedPartner} (partnerCode: ${assignedPartnerCode || 'N/A'})`);
      }
    }

    // No cooldown needed with new assignment logic
    const cooldownUntil = null;

    // Ensure assignedPartner is ObjectId
    const assignedPartnerId = mongoose.Types.ObjectId.isValid(assignedPartner)
      ? new mongoose.Types.ObjectId(assignedPartner)
      : assignedPartner;

    // Create shop request with assignment
    const shopRequest = new ShopRequest({
      name,
      email: email.toLowerCase(),
      tel,
      province,
      userId: req.user.id,
      status: 'pending',
      assignedPartnerId: assignedPartnerId,
      assignedPartnerCode: assignedPartnerCode || null, // Store partnerCode for easier identification
      assignedAt: new Date(),
      cooldownUntil: cooldownUntil
    });

    await shopRequest.save();

    // Verify assignment was saved
    const savedRequest = await ShopRequest.findById(shopRequest._id);
    console.log(`✅ Shop request created by user ${req.user.id}`);
    console.log(`   - Request ID: ${shopRequest._id}`);
    console.log(`   - Assigned Partner ID: ${savedRequest.assignedPartnerId}`);
    console.log(`   - Assigned Partner Code: ${assignedPartnerCode || 'N/A'}`);
    console.log(`   - Assigned At: ${savedRequest.assignedAt}`);

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

    console.log(`🔍 Partner lookup for user ${req.user.id}:`, {
      found: !!partner,
      province: partner?.workingArea?.province || 'N/A'
    });

    if (!partner || !partner.workingArea?.province) {
      console.log(`⚠️ Partner ${req.user.id} has no province set`);
      return res.json({
        success: true,
        data: [],
        message: 'Partner province not set. Please update your profile.'
      });
    }

    const partnerProvince = partner.workingArea.province;
    console.log(`📍 Partner ${req.user.id} working in province: ${partnerProvince}`);

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
        // Create partner info map with partnerCode
        const partnerInfoMap = new Map();
        partners.forEach(p => {
          const userId = p.userId?._id || p.userId;
          if (userId) {
            partnerInfoMap.set(userId.toString(), {
              userId: userId,
              partnerCode: p.partnerCode || null
            });
          }
        });

        const partnerIds = Array.from(partnerInfoMap.keys()).map(id => new mongoose.Types.ObjectId(id));

        for (const request of expiredCooldowns) {
          // Find next available partner (not the current assigned one)
          const currentAssignedId = request.assignedPartnerId?.toString() || request.assignedPartnerId;
          const otherPartners = partnerIds.filter(
            pid => {
              const pidStr = pid?.toString() || pid;
              return pidStr !== currentAssignedId;
            }
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

            let selectedPartnerId = null;
            let selectedPartnerCode = null;

            if (availablePartners.length > 0) {
              const randomIndex = Math.floor(Math.random() * availablePartners.length);
              selectedPartnerId = availablePartners[randomIndex];
            } else {
              // All in cooldown, use circular assignment
              const oldestCooldown = await ShopRequest.findOne({
                assignedPartnerId: { $in: otherPartners },
                cooldownUntil: { $gt: now }
              }).sort({ cooldownUntil: 1 }).select('assignedPartnerId');

              if (oldestCooldown) {
                selectedPartnerId = oldestCooldown.assignedPartnerId;
              } else {
                // Fallback: random from other partners
                const randomIndex = Math.floor(Math.random() * otherPartners.length);
                selectedPartnerId = otherPartners[randomIndex];
              }
            }

            // Get partnerCode for selected partner
            const selectedPartnerInfo = partnerInfoMap.get(selectedPartnerId.toString());
            selectedPartnerCode = selectedPartnerInfo?.partnerCode || null;

            request.assignedPartnerId = selectedPartnerId;
            request.assignedPartnerCode = selectedPartnerCode; // Store partnerCode
            request.assignedAt = new Date();
            request.cooldownUntil = new Date(Date.now() + 4 * 60 * 60 * 1000);
            await request.save();

            console.log(`✅ Reassigned expired cooldown request ${request._id} to partner ${selectedPartnerId} (partnerCode: ${selectedPartnerCode || 'N/A'})`);
          }
        }
      }
    }

    const partnerUserId = new mongoose.Types.ObjectId(req.user.id);

    console.log(`🔍 DEBUG: Looking up current partner info...`);
    console.log(`  - User ID: ${req.user.id}`);
    console.log(`  - User partnerCode from JWT: ${req.user.partnerCode || 'N/A'}`);

    const currentPartner = await Partner.findOne({ userId: req.user.id }).select('partnerCode userId');
    const currentPartnerCode = currentPartner?.partnerCode || null;

    console.log(`🔍 DEBUG: Partner lookup result:`, {
      found: !!currentPartner,
      partnerCode: currentPartnerCode || 'N/A',
      partnerUserId: currentPartner?.userId ? currentPartner.userId.toString() : 'N/A',
      userPartnerCode: req.user.partnerCode || 'N/A'
    });

    console.log(`🔍 Building query for partner:`, {
      partnerUserId_string: req.user.id,
      partnerUserId_objectId: partnerUserId.toString(),
      partnerCode: currentPartnerCode || 'N/A',
      userPartnerCode: req.user.partnerCode || 'N/A',
      partnerProvince: partnerProvince,
      status: status || 'all'
    });

    // NEW LOGIC: Partner sees ALL requests in same province (not just assigned ones)
    // But filter out requests where shop is already registered/submitted/approved
    // When partner registers shop, status becomes 'submitted' and shopId is set
    // When admin approves shop, status becomes 'registered' and shop is 'active'
    const Shop = require('../models/Shop');

    // Build query: Show all requests in same province, but exclude:
    // 1. 'submitted' and 'registered' status (partner registered shop / admin approved)
    // 2. Requests that have shopId (means shop was registered, even if not approved yet)
    // 3. Requests where shopId matches an approved (active) shop

    // Status filter: Only show 'pending' and 'contacted'
    // Exclude 'submitted' (partner registered shop) and 'registered' (admin approved)
    const statusFilter = status
      ? (status === 'pending' || status === 'contacted' ? status : { $in: [] }) // Don't show 'submitted' or 'registered'
      : { $in: ['pending', 'contacted'] }; // Default: only pending and contacted

    // Build query: Show all requests in same province, but exclude:
    // 1. Requests with status 'submitted' or 'registered' (shop was registered/admin approved)
    // 2. Requests that have shopId (means shop was registered by ANY partner)
    //    This ensures that when ANY partner registers shop, the request disappears from ALL partners immediately

    // IMPORTANT: Filter out 'submitted' and 'registered' status explicitly
    // Also filter out any request that has shopId (regardless of status)
    const queryConditions = [
      { province: partnerProvince },
      // Only show 'pending' and 'contacted' - exclude 'submitted' and 'registered'
      { status: { $in: ['pending', 'contacted'] } },
      // CRITICAL: Exclude requests that have shopId (shop was registered)
      // This ensures that when ANY partner registers shop, the request disappears from ALL partners
      {
        $or: [
          { shopId: { $exists: false } },
          { shopId: null }
        ]
      }
    ];

    // If specific status is requested, override the status filter (but still exclude 'submitted'/'registered')
    if (status) {
      if (status === 'pending' || status === 'contacted') {
        // Update status condition in queryConditions
        const statusIndex = queryConditions.findIndex(c => c.status);
        if (statusIndex !== -1) {
          queryConditions[statusIndex] = { status: status };
        }
      } else {
        // Don't show 'submitted' or 'registered' to partners - return empty result
        queryConditions.push({ status: { $in: [] } });
      }
    }

    const query = {
      $and: queryConditions
    };

    // Convert ObjectId to string for logging
    const queryForLog = JSON.parse(JSON.stringify(query, (key, value) => {
      if (value && value.constructor && value.constructor.name === 'ObjectID') {
        return value.toString();
      }
      return value;
    }));

    // Extract query details for logging
    const provinceCondition = query.$and?.find(c => c.province);
    const statusCondition = query.$and?.find(c => c.status);
    const shopIdCondition = query.$and?.find(c => c.$or);

    console.log(`🔍 DEBUG: Final query for partner ${req.user.id} (${req.user.name}):`, JSON.stringify(queryForLog, null, 2));
    console.log(`🔍 DEBUG: Query details:`, {
      province: provinceCondition?.province || 'N/A',
      status: statusCondition?.status || 'all',
      hasShopIdFilter: !!shopIdCondition,
      shopIdConditions: shopIdCondition?.$or ? shopIdCondition.$or.length : 0,
      shopIdDetails: shopIdCondition?.$or ? shopIdCondition.$or.map((cond, idx) => ({
        index: idx,
        condition: Object.keys(cond)[0],
        value: Object.values(cond)[0]
      })) : []
    });

    // First, let's check what requests exist in the database for this province
    const allProvinceRequests = await ShopRequest.find({ province: partnerProvince })
      .select('_id name status assignedPartnerId assignedPartnerCode assignedAt shopId')
      .lean();

    console.log(`📊 DEBUG: All requests in province ${partnerProvince}:`, allProvinceRequests.map(r => ({
      id: r._id,
      name: r.name,
      status: r.status,
      shopId: r.shopId ? r.shopId.toString() : 'null',
      hasShopId: !!r.shopId,
      assignedPartnerId: r.assignedPartnerId ? r.assignedPartnerId.toString() : null,
      assignedPartnerCode: r.assignedPartnerCode || 'null',
      assignedAt: r.assignedAt,
      shouldBeFiltered: r.status === 'submitted' || r.status === 'registered' || !!r.shopId,
      isAssignedToMe: currentPartnerCode ? r.assignedPartnerCode === currentPartnerCode : r.assignedPartnerId?.toString() === partnerUserId.toString()
    })));

    // Auto-reassign requests that are assigned to wrong partner but in same province
    const partnerUserIdStr = req.user.id.toString();

    // Use currentPartnerCode from above (already declared at line 357)

    // Find requests in this province that are assigned to a partner not in this province
    const allPartnersInProvince = await Partner.find({
      'workingArea.province': partnerProvince,
      status: 'approved'
    }).select('userId partnerCode');

    const validPartnerIds = allPartnersInProvince.map(p => {
      const userId = p.userId?._id || p.userId;
      return userId ? userId.toString() : null;
    }).filter(id => id !== null);

    console.log(`🔍 Valid partner IDs in province ${partnerProvince}:`, validPartnerIds);
    console.log(`🔍 Current partner code: ${currentPartnerCode || 'N/A'}`);

    // Find requests assigned to OTHER partners (not this partner)
    // Use assignedPartnerCode if available, otherwise fallback to assignedPartnerId
    console.log(`🔍 DEBUG: Looking for requests assigned to other partners...`);
    console.log(`  - Current partnerCode: ${currentPartnerCode || 'N/A'}`);
    console.log(`  - Current partnerId: ${partnerUserIdStr}`);

    const wrongAssignedRequests = await ShopRequest.find({
      province: partnerProvince,
      status: 'pending',
      $or: [
        // If we have partnerCode, check by partnerCode first
        ...(currentPartnerCode ? [
          {
            assignedPartnerCode: { $ne: null, $ne: currentPartnerCode }
          }
        ] : []),
        // Also check by userId (for backward compatibility)
        {
          assignedPartnerId: {
            $ne: null,
            $ne: partnerUserId
          }
        }
      ]
    }).select('assignedPartnerId assignedPartnerCode');

    console.log(`🔍 DEBUG: Found ${wrongAssignedRequests.length} requests assigned to other partners`);
    wrongAssignedRequests.forEach((req, idx) => {
      console.log(`  Request ${idx + 1}:`, {
        id: req._id,
        assignedPartnerId: req.assignedPartnerId ? req.assignedPartnerId.toString() : 'null',
        assignedPartnerCode: req.assignedPartnerCode || 'null',
        isAssignedToMe: currentPartnerCode ? req.assignedPartnerCode === currentPartnerCode : req.assignedPartnerId?.toString() === partnerUserIdStr
      });
    });

    // Only reassign if there are requests assigned to OTHER partners
    // Don't reassign if requests are already assigned to this partner
    if (wrongAssignedRequests.length > 0 && currentPartnerCode) {
      // Filter out requests that are already assigned to this partner by code
      const requestsToReassign = wrongAssignedRequests.filter(req => {
        const assignedCode = req.assignedPartnerCode;
        const isAssignedToMe = assignedCode === currentPartnerCode;

        console.log(`  🔍 Checking request ${req._id}:`, {
          assignedCode: assignedCode || 'null',
          currentCode: currentPartnerCode,
          isAssignedToMe: isAssignedToMe,
          shouldReassign: !isAssignedToMe
        });

        return !isAssignedToMe;
      });

      console.log(`🔧 Found ${requestsToReassign.length} requests to reassign (out of ${wrongAssignedRequests.length} total)`);

      if (requestsToReassign.length > 0) {
        console.log(`🔧 Reassigning ${requestsToReassign.length} requests to current partner ${partnerUserIdStr} (partnerCode: ${currentPartnerCode})...`);

        for (const request of requestsToReassign) {
          const currentAssignedId = request.assignedPartnerId?.toString() || request.assignedPartnerId;
          const currentAssignedCode = request.assignedPartnerCode || 'N/A';

          // Check if the currently assigned partner is valid in this province
          const isCurrentPartnerValid = validPartnerIds.includes(currentAssignedId);

          console.log(`  🔄 Reassigning request ${request._id}:`, {
            from: {
              partnerId: currentAssignedId,
              partnerCode: currentAssignedCode,
              valid: isCurrentPartnerValid
            },
            to: {
              partnerId: partnerUserIdStr,
              partnerCode: currentPartnerCode
            }
          });

          // Reassign to current partner
          request.assignedPartnerId = partnerUserId;
          request.assignedPartnerCode = currentPartnerCode; // Store partnerCode
          request.assignedAt = new Date();
          request.cooldownUntil = new Date(Date.now() + 4 * 60 * 60 * 1000);
          await request.save();

          console.log(`✅ Auto-reassigned request ${request._id} from partner ${currentAssignedId} (${currentAssignedCode}) to ${partnerUserIdStr} (${currentPartnerCode})`);
        }
      } else {
        console.log(`✅ All requests are already assigned to current partner (${currentPartnerCode}), no reassignment needed`);
      }
    } else if (wrongAssignedRequests.length > 0 && !currentPartnerCode) {
      // Fallback: if no partnerCode, use old logic with userId
      console.log(`⚠️ No partnerCode available, using userId-based reassignment (legacy mode)`);

      for (const request of wrongAssignedRequests) {
        const currentAssignedId = request.assignedPartnerId?.toString() || request.assignedPartnerId;

        // Reassign to current partner
        request.assignedPartnerId = partnerUserId;
        request.assignedAt = new Date();
        request.cooldownUntil = new Date(Date.now() + 4 * 60 * 60 * 1000);
        await request.save();

        console.log(`✅ Auto-reassigned request ${request._id} from partner ${currentAssignedId} to ${partnerUserIdStr} (no partnerCode)`);
      }
    } else {
      console.log(`✅ No requests need reassignment`);
    }

    // Execute query and log results for debugging
    console.log(`🔍 Executing query for partner ${req.user.id}:`, JSON.stringify(queryForLog, null, 2));

    let shopRequests = await ShopRequest.find(query)
      .populate('userId', 'name email photo')
      .populate({
        path: 'assignedPartnerId',
        select: 'name email photo',
        model: 'User'
      })
      .populate('partnerId', 'name email photo')
      .populate('shopId', 'shopName shopId status')
      .sort({ createdAt: -1 });

    // Log filtered results
    console.log(`📊 Query returned ${shopRequests.length} requests (after filtering)`);
    console.log(`📊 Total requests in province before filtering: ${allProvinceRequests.length}`);

    // Check which requests were filtered out
    const filteredOutRequests = allProvinceRequests.filter(r => {
      const hasShopId = !!r.shopId;
      const isSubmittedOrRegistered = r.status === 'submitted' || r.status === 'registered';
      const shouldBeFiltered = hasShopId || isSubmittedOrRegistered;
      return shouldBeFiltered;
    });

    console.log(`📊 Filtered out ${filteredOutRequests.length} requests:`, filteredOutRequests.map(r => ({
      id: r._id,
      name: r.name,
      status: r.status,
      shopId: r.shopId ? r.shopId.toString() : 'null',
      reason: r.status === 'submitted' || r.status === 'registered' ? 'status' : 'hasShopId'
    })));

    shopRequests.forEach((req, idx) => {
      const shopIdValue = req.shopId ? (req.shopId._id || req.shopId).toString() : 'null';
      console.log(`  ✅ Request ${idx + 1} (PASSED FILTER):`, {
        id: req._id,
        name: req.name,
        status: req.status,
        shopId: shopIdValue,
        hasShopId: !!req.shopId,
        shouldBeVisible: !req.shopId && req.status !== 'submitted' && req.status !== 'registered'
      });
    });

    // Update old requests that don't have assignedPartnerCode
    // This is a migration step for requests created before assignedPartnerCode was added
    console.log(`🔍 DEBUG: Checking ${shopRequests.length} requests for assignedPartnerCode...`);

    const requestsNeedingUpdate = shopRequests.filter(req => {
      const hasAssignedPartner = req.assignedPartnerId;
      const assignedPartnerIdValue = hasAssignedPartner ? (hasAssignedPartner._id || hasAssignedPartner) : null;
      const hasCode = req.assignedPartnerCode;

      console.log(`  📋 Request ${req._id}:`, {
        hasAssignedPartner: !!hasAssignedPartner,
        assignedPartnerIdValue: assignedPartnerIdValue ? assignedPartnerIdValue.toString() : 'null',
        hasAssignedPartnerCode: !!hasCode,
        assignedPartnerCode: hasCode || 'null',
        needsUpdate: assignedPartnerIdValue && !hasCode
      });

      return assignedPartnerIdValue && !req.assignedPartnerCode;
    });

    console.log(`🔍 DEBUG: Found ${requestsNeedingUpdate.length} requests needing update out of ${shopRequests.length} total`);

    if (requestsNeedingUpdate.length > 0) {
      console.log(`🔧 Found ${requestsNeedingUpdate.length} requests without assignedPartnerCode, updating...`);

      for (const req of requestsNeedingUpdate) {
        try {
          const assignedPartnerIdValue = req.assignedPartnerId ? (req.assignedPartnerId._id || req.assignedPartnerId) : null;
          if (!assignedPartnerIdValue) {
            console.log(`  ⚠️ Request ${req._id}: No assignedPartnerIdValue, skipping`);
            continue;
          }

          console.log(`  🔍 Looking up partner for userId: ${assignedPartnerIdValue.toString()}`);

          // Find partner by assignedPartnerId
          const partner = await Partner.findOne({
            userId: assignedPartnerIdValue
          }).select('partnerCode userId');

          console.log(`  🔍 Partner lookup result:`, {
            found: !!partner,
            partnerCode: partner?.partnerCode || 'N/A',
            partnerUserId: partner?.userId ? partner.userId.toString() : 'N/A'
          });

          if (partner && partner.partnerCode) {
            console.log(`  ✅ Updating request ${req._id} in database with assignedPartnerCode: ${partner.partnerCode}`);

            // Update the request in database
            const updateResult = await ShopRequest.findByIdAndUpdate(req._id, {
              assignedPartnerCode: partner.partnerCode
            }, { new: true });

            console.log(`  ✅ Database update result:`, {
              success: !!updateResult,
              updatedCode: updateResult?.assignedPartnerCode || 'N/A'
            });

            // Update in memory for this response
            // Use set() to ensure Mongoose document includes the field
            if (req.set && typeof req.set === 'function') {
              req.set('assignedPartnerCode', partner.partnerCode);
              console.log(`  ✅ Used req.set() to update assignedPartnerCode`);
            } else {
              req.assignedPartnerCode = partner.partnerCode;
              console.log(`  ✅ Directly set req.assignedPartnerCode`);
            }
            // Also set directly on the object
            req.assignedPartnerCode = partner.partnerCode;

            // Verify the update
            const verifyCode = req.assignedPartnerCode || req.get?.('assignedPartnerCode') || null;
            console.log(`  ✅ Updated request ${req._id} with assignedPartnerCode: ${partner.partnerCode}`);
            console.log(`     - Verification: req.assignedPartnerCode = ${verifyCode}`);
            console.log(`     - Type: ${typeof verifyCode}`);
            console.log(`     - Has property: ${'assignedPartnerCode' in req}`);
          } else {
            console.log(`  ⚠️ No partner found for assignedPartnerId: ${assignedPartnerIdValue.toString()}`);
            console.log(`     - Partner object:`, partner ? 'exists but no partnerCode' : 'not found');
          }
        } catch (error) {
          console.error(`  ⚠️ Error updating request ${req._id}:`, {
            message: error.message,
            stack: error.stack
          });
        }
      }
    } else {
      console.log(`✅ All ${shopRequests.length} requests already have assignedPartnerCode`);
    }

    // Debug: Check if assignedPartnerId was populated
    console.log(`🔍 Checking populate results:`);
    shopRequests.forEach((req, idx) => {
      const assignedPartner = req.assignedPartnerId;
      console.log(`  Request ${idx + 1}:`, {
        assignedPartnerId_type: typeof assignedPartner,
        assignedPartnerId_isObject: typeof assignedPartner === 'object' && assignedPartner !== null,
        assignedPartnerId_hasId: assignedPartner?._id ? 'yes' : 'no',
        assignedPartnerId_value: assignedPartner?._id || assignedPartner,
        assignedPartnerName: assignedPartner?.name || 'N/A'
      });
    });

    console.log(`✅ Partner ${req.user.id} (${req.user.name}) found ${shopRequests.length} requests`);
    console.log(`🔍 CRITICAL: Partner User ID from JWT: ${req.user.id}`);
    shopRequests.forEach((request, idx) => {
      const assignedPartner = request.assignedPartnerId;
      const assignedPartnerIdValue = assignedPartner ? (assignedPartner._id || assignedPartner) : null;
      const assignedPartnerIdStr = assignedPartnerIdValue ? assignedPartnerIdValue.toString() : null;
      const myUserIdStr = req.user.id.toString();
      const isAssignedToMe = assignedPartnerIdStr === myUserIdStr;

      const assignedPartnerCode = request.assignedPartnerCode || null;
      const myPartnerCode = req.user.partnerCode || null;
      const isAssignedToMeByCode = assignedPartnerCode && myPartnerCode && assignedPartnerCode === myPartnerCode;

      console.log(`  📋 Request ${idx + 1} (${request.name || 'N/A'}):`, {
        requestId: request._id,
        status: request.status,
        province: request.province,
        hasAssignedPartner: !!assignedPartner,
        assignedPartnerId_raw: assignedPartnerIdValue,
        assignedPartnerId_string: assignedPartnerIdStr,
        assignedPartnerCode: assignedPartnerCode || 'N/A',
        myUserId_string: myUserIdStr,
        myPartnerCode: myPartnerCode || 'N/A',
        isAssignedToMe: isAssignedToMe,
        isAssignedToMeByCode: isAssignedToMeByCode,
        assignedPartnerName: assignedPartner?.name || assignedPartner?.email || 'N/A',
        assignedAt: request.assignedAt,
        cooldownUntil: request.cooldownUntil,
        ID_MATCH: {
          assignedPartnerId: assignedPartnerIdStr,
          myUserId: myUserIdStr,
          match: assignedPartnerIdStr === myUserIdStr,
          reason: assignedPartnerIdStr === myUserIdStr ? '✅ MATCH' : '❌ NO MATCH - This is why partner cannot see the request!'
        },
        CODE_MATCH: {
          assignedPartnerCode: assignedPartnerCode || 'N/A',
          myPartnerCode: myPartnerCode || 'N/A',
          match: isAssignedToMeByCode,
          reason: isAssignedToMeByCode ? '✅ MATCH BY CODE' : '❌ NO MATCH BY CODE'
        }
      });
    });

    // Convert Mongoose documents to plain objects to ensure proper serialization
    console.log(`🔍 DEBUG: Converting ${shopRequests.length} requests to response format...`);

    const responseData = {
      success: true,
      data: shopRequests.map((req, idx) => {
        console.log(`  🔍 Processing request ${idx + 1}/${shopRequests.length} (${req._id}):`);
        console.log(`     - Before toObject():`, {
          hasToObject: typeof req.toObject === 'function',
          assignedPartnerCode_before: req.assignedPartnerCode || 'null',
          assignedPartnerCode_type: typeof req.assignedPartnerCode,
          hasProperty: 'assignedPartnerCode' in req,
          assignedPartnerId: req.assignedPartnerId ? (req.assignedPartnerId._id || req.assignedPartnerId).toString() : 'null'
        });

        const plainReq = req.toObject ? req.toObject() : req;

        console.log(`     - After toObject():`, {
          assignedPartnerCode_after: plainReq.assignedPartnerCode || 'null',
          assignedPartnerCode_type: typeof plainReq.assignedPartnerCode,
          hasProperty: 'assignedPartnerCode' in plainReq,
          allKeys: Object.keys(plainReq).filter(k => k.includes('assigned') || k.includes('partner'))
        });

        // Ensure assignedPartnerId is properly included
        if (plainReq.assignedPartnerId) {
          // If it's a populated object, keep it; if it's an ObjectId, convert to string
          if (plainReq.assignedPartnerId._id) {
            // Already populated, keep as is
            console.log(`     - assignedPartnerId is populated object`);
          } else if (typeof plainReq.assignedPartnerId === 'object' && plainReq.assignedPartnerId.toString) {
            // It's an ObjectId, convert to string for consistency
            plainReq.assignedPartnerId = plainReq.assignedPartnerId.toString();
            console.log(`     - Converted assignedPartnerId to string: ${plainReq.assignedPartnerId}`);
          }
        }

        // Ensure assignedPartnerCode is included
        // Check both plainReq (from toObject) and req (original document)
        if (!plainReq.assignedPartnerCode) {
          console.log(`     - assignedPartnerCode missing in plainReq, trying to get from req...`);

          // Try to get from original document
          if (req.assignedPartnerCode) {
            plainReq.assignedPartnerCode = req.assignedPartnerCode;
            console.log(`     - Got from req.assignedPartnerCode: ${plainReq.assignedPartnerCode}`);
          } else if (req.get && typeof req.get === 'function') {
            // Try to get from Mongoose document
            const code = req.get('assignedPartnerCode');
            if (code) {
              plainReq.assignedPartnerCode = code;
              console.log(`     - Got from req.get('assignedPartnerCode'): ${plainReq.assignedPartnerCode}`);
            } else {
              console.log(`     - req.get('assignedPartnerCode') returned: ${code}`);
            }
          } else {
            console.log(`     - req.get is not a function`);
          }
        } else {
          console.log(`     - assignedPartnerCode already in plainReq: ${plainReq.assignedPartnerCode}`);
        }

        // Explicitly ensure it's in the response (even if null/undefined)
        if (!('assignedPartnerCode' in plainReq)) {
          const fallbackCode = req.assignedPartnerCode || null;
          plainReq.assignedPartnerCode = fallbackCode;
          console.log(`     - Added assignedPartnerCode as fallback: ${fallbackCode}`);
        }

        console.log(`     - Final result:`, {
          assignedPartnerCode: plainReq.assignedPartnerCode || 'null',
          hasProperty: 'assignedPartnerCode' in plainReq,
          assignedPartnerId: plainReq.assignedPartnerId || 'null'
        });

        return plainReq;
      })
    };

    console.log(`📤 DEBUG: Final response data structure:`);
    console.log(`  - Total requests: ${responseData.data.length}`);
    console.log(`  - Success: ${responseData.success}`);

    responseData.data.forEach((req, idx) => {
      console.log(`  📋 Request ${idx + 1} (${req._id || 'N/A'}):`, {
        name: req.name || 'N/A',
        assignedPartnerId: req.assignedPartnerId || 'null',
        assignedPartnerId_type: typeof req.assignedPartnerId,
        assignedPartnerCode: req.assignedPartnerCode || 'null',
        assignedPartnerCode_type: typeof req.assignedPartnerCode,
        hasAssignedPartnerCode: 'assignedPartnerCode' in req,
        allAssignedKeys: Object.keys(req).filter(k => k.includes('assigned') || k.includes('partner')),
        status: req.status || 'N/A',
        province: req.province || 'N/A'
      });
    });

    console.log(`📤 Sending response to partner ${req.user.id} (${req.user.name}):`, {
      success: responseData.success,
      dataCount: responseData.data.length,
      dataIds: responseData.data.map(r => r._id?.toString() || r._id),
      firstRequest: responseData.data[0] ? {
        id: responseData.data[0]._id,
        name: responseData.data[0].name,
        assignedPartnerId: responseData.data[0].assignedPartnerId,
        assignedPartnerCode: responseData.data[0].assignedPartnerCode || 'N/A',
        hasAssignedPartnerCode: 'assignedPartnerCode' in responseData.data[0],
        assignedPartnerCode_type: typeof responseData.data[0].assignedPartnerCode,
        assignedPartnerId_type: typeof responseData.data[0].assignedPartnerId,
        assignedPartnerId_isObject: typeof responseData.data[0].assignedPartnerId === 'object' && responseData.data[0].assignedPartnerId !== null,
        allKeys: Object.keys(responseData.data[0]).slice(0, 10) // First 10 keys
      } : null
    });

    res.json(responseData);
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
      images,
      shopMode,
      isOpen,
      deliveryOption,
      accountName,
      accountNumber,
      bankName,
      bankBranch
    } = req.body;

    const shopRequest = await ShopRequest.findById(req.params.id);
    if (!shopRequest) {
      return res.status(404).json({
        success: false,
        message: 'Shop request not found'
      });
    }

    if (shopRequest.status === 'registered' || shopRequest.status === 'submitted') {
      return res.status(400).json({
        success: false,
        message: 'Shop has already been submitted/registered from this request'
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

    // Upload images to GCP immediately when submitted
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
          // Use shop._id as temporary ID (will be updated when approved with shopId)
          const tempShopId = `temp_${Date.now()}_${req.user.id}`;
          uploadedImageUrls = await uploadShopImages(imageBuffers, tempShopId);
          console.log(`✅ Uploaded ${uploadedImageUrls.length} images to GCP for shop submission`);
        }
      } catch (uploadError) {
        console.error('❌ Error uploading images to GCP:', uploadError);
        // Continue with shop creation even if image upload fails
      }
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
      images: uploadedImageUrls.length > 0 ? uploadedImageUrls : [], // Store GCP URLs
      shopMode: shopMode || 'both',
      isOpen: isOpen !== undefined ? isOpen : true,
      deliveryOption: deliveryOption || 'both',
      bankAccount: {
        accountName: accountName || '',
        accountNumber: accountNumber || '',
        bankName: bankName || '',
        bankBranch: bankBranch || ''
      },
      status: 'pending' // Admin needs to approve
    });

    await shop.save();

    // Update shop request - set status to 'submitted' (waiting for admin approval)
    shopRequest.status = 'submitted';
    shopRequest.partnerId = req.user.id;
    shopRequest.shopId = shop._id;
    shopRequest.registeredAt = new Date();
    // Clear cooldown when submitted
    shopRequest.cooldownUntil = null;
    await shopRequest.save();

    console.log(`✅ Shop submitted from request ${req.params.id} by partner ${req.user.id} - waiting for admin approval`);

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
 * Get all shop requests (admin view). Optional ?status=pending|contacted|submitted|registered|rejected
 */
router.get('/admin', auth, adminAuth, async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};

    const shopRequests = await ShopRequest.find(query)
      .populate('userId', 'name email photo')
      .populate('partnerId', 'name email photo')
      .populate({
        path: 'assignedPartnerId',
        select: 'name email photo',
        model: 'User'
      })
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
 * PUT /api/shop-requests/:id/assign
 * Admin only: manually assign a shop request to a partner. Restarts cooldown (4h).
 */
router.put('/:id/assign', auth, adminAuth, async (req, res) => {
  try {
    const shopRequest = await ShopRequest.findById(req.params.id);
    if (!shopRequest) {
      return res.status(404).json({ success: false, message: 'Shop request not found' });
    }

    const { partnerId, partnerCode } = req.body;
    if (!partnerId && !partnerCode) {
      return res.status(400).json({
        success: false,
        message: 'Provide partnerId or partnerCode'
      });
    }

    const Partner = require('../models/Partner');
    let partner = null;
    if (partnerId) {
      partner = await Partner.findOne({
        userId: partnerId,
        status: 'approved'
      }).populate('userId', 'name email');
    } else {
      partner = await Partner.findOne({
        partnerCode: partnerCode?.trim(),
        status: 'approved'
      }).populate('userId', 'name email');
    }

    if (!partner || !partner.userId) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found or not approved'
      });
    }

    const partnerProvince = partner.workingArea?.province;
    const normalizeProvince = (name) => {
      if (!name || typeof name !== 'string') return '';
      return String(name).replace(/จังหวัด/g, '').replace(/ฯ/g, '').trim();
    };
    if (!partnerProvince || normalizeProvince(shopRequest.province) !== normalizeProvince(partnerProvince)) {
      return res.status(400).json({
        success: false,
        message: `Partner must be in the same province (${shopRequest.province})`
      });
    }

    const newAssignedPartnerId = partner.userId._id || partner.userId;
    const cooldownUntil = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours – restart countdown

    shopRequest.assignedPartnerId = newAssignedPartnerId;
    shopRequest.assignedPartnerCode = partner.partnerCode || null;
    shopRequest.assignedAt = new Date();
    shopRequest.cooldownUntil = cooldownUntil;
    await shopRequest.save();

    const updated = await ShopRequest.findById(shopRequest._id)
      .populate('assignedPartnerId', 'name email')
      .lean();

    res.json({
      success: true,
      message: 'Shop request assigned; cooldown restarted (4h)',
      data: updated
    });
  } catch (error) {
    console.error('Error assigning shop request:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * PUT /api/shop-requests/:id/reassign
 * Reassign a shop request to the correct partner (admin only, or auto-reassign for partner)
 */
router.put('/:id/reassign', auth, async (req, res) => {
  try {
    const shopRequest = await ShopRequest.findById(req.params.id);

    if (!shopRequest) {
      return res.status(404).json({
        success: false,
        message: 'Shop request not found'
      });
    }

    const isAdmin = req.user.userType === 'admin';
    const isPartner = req.user.partnerId;

    // Admin can reassign to any partner, partner can only reassign to themselves
    if (!isAdmin && !isPartner) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin or Partner privileges required.'
      });
    }

    // Get partner's province from Partner model
    const Partner = require('../models/Partner');
    const partner = await Partner.findOne({ userId: req.user.id }).select('workingArea.province');

    if (!partner || !partner.workingArea?.province) {
      return res.status(400).json({
        success: false,
        message: 'Partner province not set. Please update your profile.'
      });
    }

    const partnerProvince = partner.workingArea.province;

    // Check if request is in the same province
    if (shopRequest.province !== partnerProvince) {
      return res.status(400).json({
        success: false,
        message: 'Request is not in your assigned province.'
      });
    }

    // Get current partner's partnerCode (Partner already required at line 837)
    const currentPartner = await Partner.findOne({ userId: req.user.id }).select('partnerCode');
    const currentPartnerCode = currentPartner?.partnerCode || null;

    // Reassign to current partner
    const newAssignedPartnerId = new mongoose.Types.ObjectId(req.user.id);
    const cooldownUntil = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours

    shopRequest.assignedPartnerId = newAssignedPartnerId;
    shopRequest.assignedPartnerCode = currentPartnerCode; // Store partnerCode
    shopRequest.assignedAt = new Date();
    shopRequest.cooldownUntil = cooldownUntil;

    await shopRequest.save();

    console.log(`✅ Shop request ${req.params.id} reassigned to partner ${req.user.id} (${req.user.name})`);

    res.json({
      success: true,
      message: 'Shop request reassigned successfully',
      data: shopRequest
    });
  } catch (error) {
    console.error('Error reassigning shop request:', error);
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
