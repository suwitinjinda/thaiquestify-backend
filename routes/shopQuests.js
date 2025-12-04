// backend/routes/shopQuests.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Quest = require('../models/Quest');
const QuestTemplate = require('../models/QuestTemplate');
const Shop = require('../models/Shop');

// Apply auth middleware to all routes
router.use(auth);

// Get quests - Role-based filtering
// router.get('/quests', async (req, res) => {
//   try {
//     let query = { isDeleted: { $ne: true } };
    
//     // Shop owner can only see their own shop's quests
//     if (req.user.userType === 'shop') {
//       const shop = await Shop.findOne({ user: req.user.id });
//       if (!shop) {
//         return res.status(404).json({ 
//           success: false,
//           message: 'Shop not found' 
//         });
//       }
//       query.shop = shop._id;
//     }
//     // Admin can see all quests (no additional query)
//     // Partner/customer cannot access
//     else if (req.user.userType !== 'admin') {
//       return res.status(403).json({ 
//         success: false,
//         message: 'Access denied. Shop owners and admins only.' 
//       });
//     }

//     console.log(`🔍 ${req.user.userType} fetching quests with query:`, query);
    
//     const quests = await Quest.find(query)
//       .populate('template')
//       .populate('shop', 'shopName province phone')
//       .sort({ createdAt: -1 });

//     res.json({
//       success: true,
//       data: quests,
//       count: quests.length,
//       userType: req.user.userType
//     });

//   } catch (error) {
//     console.error('❌ Get quests error:', error);
//     res.status(500).json({ 
//       success: false,
//       message: 'Server error', 
//       error: error.message 
//     });
//   }
// });

// Create quest from template
// router.post('/quests', async (req, res) => {
//   try {
//     console.log('🔄 Creating quest for user:', req.user.userType);
    
//     // Only allow shop owners and admins
//     if (req.user.userType !== 'shop' && req.user.userType !== 'admin') {
//       return res.status(403).json({ 
//         success: false,
//         message: 'Access denied. Shop owners and admins only.' 
//       });
//     }

//     const { templateId, budget, maxParticipants, duration } = req.body;
    
//     // Validate required fields
//     if (!templateId || !budget || !maxParticipants) {
//       return res.status(400).json({
//         success: false,
//         message: 'Missing required fields: templateId, budget, maxParticipants'
//       });
//     }

//     // Get template
//     const template = await QuestTemplate.findById(templateId);
//     if (!template) {
//       return res.status(404).json({ 
//         success: false,
//         message: 'Template not found' 
//       });
//     }

//     // For shop owner: use their own shop
//     // For admin: require shopId in request body
//     let shopId;
//     if (req.user.userType === 'shop') {
//       const shop = await Shop.findOne({ user: req.user.id });
//       if (!shop) {
//         return res.status(404).json({ 
//           success: false,
//           message: 'Shop not found' 
//         });
//       }
//       shopId = shop._id;
//     } else if (req.user.userType === 'admin') {
//       shopId = req.body.shopId;
//       if (!shopId) {
//         return res.status(400).json({
//           success: false,
//           message: 'shopId is required for admin users'
//         });
//       }
//     }

//     // Calculate reward amount per participant
//     const rewardAmount = parseFloat(budget) / parseInt(maxParticipants);
    
//     // Create quest
//     const quest = new Quest({
//       name: template.name,
//       description: template.description,
//       template: templateId,
//       shop: shopId,
//       budget: parseFloat(budget),
//       rewardAmount: rewardAmount,
//       rewardPoints: template.rewardPoints,
//       maxParticipants: parseInt(maxParticipants),
//       duration: parseInt(duration) || 7,
//       status: 'active',
//       isActive: true,
//       createdBy: req.user.id,
//       startDate: new Date(),
//       endDate: new Date(Date.now() + (parseInt(duration) || 7) * 24 * 60 * 60 * 1000)
//     });

//     await quest.save();
//     await quest.populate('template');
//     await quest.populate('shop', 'shopName province');

//     console.log('✅ Quest created:', {
//       id: quest._id,
//       name: quest.name,
//       shop: quest.shop?.shopName,
//       userType: req.user.userType,
//       budget: quest.budget,
//       participants: quest.maxParticipants
//     });

//     res.status(201).json({
//       success: true,
//       message: 'Quest created successfully',
//       data: quest
//     });

//   } catch (error) {
//     console.error('❌ Create quest error:', error);
//     res.status(500).json({ 
//       success: false,
//       message: 'Server error', 
//       error: error.message 
//     });
//   }
// });

// Get quest by ID - Role-based access
router.get('/:id', async (req, res) => {
  try {
    const quest = await Quest.findOne({ _id: req.params.id, isDeleted: { $ne: true } })
      .populate('template')
      .populate('shop', 'shopName province phone user')
      .populate('submissions.user', 'name email');

    if (!quest) {
      return res.status(404).json({ 
        success: false,
        message: 'Quest not found' 
      });
    }
    console.log(quest)
    console.log(req.user)
    // Check access permissions
    if (req.user.userType === 'shop') {
      const shop = await Shop.findOne({ user: req.user.id , shopId: quest.shopId});
      console.log(shop)
      if (!shop || quest.shop._id.toString() !== shop._id.toString()) {
        return res.status(403).json({ 
          success: false,
          message: 'Access denied. You can only view your shop quests.' 
        });
      }
    }
    // Admin can access any quest without additional checks

    res.json({
      success: true,
      data: quest
    });

  } catch (error) {
    console.error('❌ Get quest error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Update this route in shopQuests.js getQuestsByShopId
router.get('/shop/:shopId/quests', auth, async (req, res) => {
  try {
    const { shopId } = req.params;
    const { status, page = 1, limit = 20 } = req.query;

    console.log(`🔍 Fetching quests for shop: ${shopId}`);

    // Verify shop exists
    const shop = await Shop.find({ shopId: shopId });
    console.log(shop)
    if (!shop) {
      return res.status(404).json({ 
        success: false,
        message: 'Shop not found' 
      });
    }

    // Check permissions
    // if (req.user.userType === 'shop') {
    //   const userShop = await Shop.findOne({ user: req.user._id });
    //   if (!userShop || userShop._id.toString() !== shopId) {
    //     return res.status(403).json({ 
    //       success: false,
    //       message: 'Access denied. You can only view your own shop quests.' 
    //     });
    //   }
    // } else if (req.user.userType !== 'admin') {
    //   return res.status(403).json({ 
    //     success: false,
    //     message: 'Access denied. Shop owners and admins only.' 
    //   });
    // }

    let query = { 
      shopId: shopId,
      isDeleted: { $ne: true } 
    };

    if (status && status !== 'all') {
      query.status = status;
    }

    const quests = await Quest.find(query)
      .populate('template', 'name description rewardPoints')
      .populate('shopId', 'shopName province phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Quest.countDocuments(query);

    console.log(`✅ Found ${quests.length} quests for shop ${shop.shopName}`);

    // ✅ Return success even with empty array
    res.json({
      success: true,
      data: quests,
      statistics: {
        totalQuests: total,
        activeQuests: quests.filter(q => q.status === 'active').length,
        completedQuests: quests.filter(q => q.status === 'completed').length
      },
      shopInfo: {
        shopId: shop.shopId,
        shopName: shop.shopName,
        province: shop.province,
        status: shop.status
      },
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      },
      message: total === 0 ? 'No quests found for this shop' : 'Quests retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Get quests by shop ID error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});
// Toggle quest active status (activate/deactivate)
router.patch('/quests/:id/toggle-active', async (req, res) => {
  try {
    const quest = await Quest.findOne({ _id: req.params.id, isDeleted: { $ne: true } });

    if (!quest) {
      return res.status(404).json({ 
        success: false,
        message: 'Quest not found' 
      });
    }

    // Verify ownership for shop owners
    if (req.user.userType === 'shop') {
      const shop = await Shop.findOne({ user: req.user.id });
      if (!shop || quest.shop.toString() !== shop._id.toString()) {
        return res.status(403).json({ 
          success: false,
          message: 'Access denied' 
        });
      }
    }
    // Admin can toggle any quest

    // Toggle isActive status
    quest.isActive = !quest.isActive;
    
    // Also update status field for consistency
    if (!quest.isActive) {
      quest.status = 'paused';
    } else {
      quest.status = 'active';
    }

    await quest.save();
    await quest.populate('template');
    await quest.populate('shop', 'shopName province');

    res.json({
      success: true,
      message: `Quest ${quest.isActive ? 'activated' : 'deactivated'} successfully`,
      data: quest
    });
  } catch (error) {
    console.error('❌ Toggle quest active status error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Update quest
router.put('/quests/:id', async (req, res) => {
  try {
    const { name, description, budget, maxParticipants, duration } = req.body;
    
    const quest = await Quest.findOne({ _id: req.params.id, isDeleted: { $ne: true } });

    if (!quest) {
      return res.status(404).json({ 
        success: false,
        message: 'Quest not found' 
      });
    }

    // Verify ownership for shop owners
    if (req.user.userType === 'shop') {
      const shop = await Shop.findOne({ user: req.user.id });
      if (!shop || quest.shop.toString() !== shop._id.toString()) {
        return res.status(403).json({ 
          success: false,
          message: 'Access denied' 
        });
      }
    }
    // Admin can update any quest

    // Check if quest has submissions (restrict editing if it does)
    if (quest.submissions.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Cannot edit quest that already has submissions' 
      });
    }

    // Calculate new reward amount if budget or maxParticipants changed
    let rewardAmount = quest.rewardAmount;
    if (budget && maxParticipants) {
      rewardAmount = budget / maxParticipants;
    } else if (budget) {
      rewardAmount = budget / quest.maxParticipants;
    } else if (maxParticipants) {
      rewardAmount = quest.budget / maxParticipants;
    }

    // Update quest fields
    if (name) quest.name = name;
    if (description) quest.description = description;
    if (budget) quest.budget = budget;
    if (maxParticipants) quest.maxParticipants = maxParticipants;
    if (duration) {
      quest.duration = duration;
      quest.endDate = new Date(quest.startDate);
      quest.endDate.setDate(quest.endDate.getDate() + duration);
    }
    quest.rewardAmount = rewardAmount;

    // Handle budget changes for shop owners
    if (req.user.userType === 'shop' && budget && budget !== quest.budget) {
      const shop = await Shop.findOne({ user: req.user.id });
      const budgetDifference = budget - quest.budget;
      
      if (budgetDifference > 0) {
        // Increase budget - check if shop has enough balance
        if (shop.balance < budgetDifference) {
          return res.status(400).json({ 
            success: false,
            message: 'Insufficient balance for budget increase' 
          });
        }
        shop.balance -= budgetDifference;
        shop.reservedBalance += budgetDifference;
      } else {
        // Decrease budget - return funds to shop
        shop.balance += Math.abs(budgetDifference);
        shop.reservedBalance -= Math.abs(budgetDifference);
      }
      
      await shop.save();
    }

    await quest.save();
    await quest.populate('template');
    await quest.populate('shop', 'shopName province');

    res.json({
      success: true,
      message: 'Quest updated successfully',
      data: quest
    });
  } catch (error) {
    console.error('❌ Update quest error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Delete quest (soft delete)
router.delete('/quests/:id', async (req, res) => {
  try {
    const quest = await Quest.findOne({ _id: req.params.id, isDeleted: { $ne: true } });

    if (!quest) {
      return res.status(404).json({ 
        success: false,
        message: 'Quest not found' 
      });
    }

    // Verify ownership for shop owners
    if (req.user.userType === 'shop') {
      const shop = await Shop.findOne({ user: req.user.id });
      if (!shop || quest.shop.toString() !== shop._id.toString()) {
        return res.status(403).json({ 
          success: false,
          message: 'Access denied' 
        });
      }
    }
    // Admin can delete any quest

    // Check if quest has approved submissions
    const hasApprovedSubmissions = quest.submissions.some(sub => sub.status === 'approved');
    if (hasApprovedSubmissions) {
      return res.status(400).json({ 
        success: false,
        message: 'Cannot delete quest with approved submissions' 
      });
    }

    // Return reserved funds to shop balance (for shop owners)
    if (req.user.userType === 'shop') {
      const shop = await Shop.findOne({ user: req.user.id });
      const remainingBudget = quest.budget - quest.totalSpent;
      if (remainingBudget > 0) {
        shop.balance += remainingBudget;
        shop.reservedBalance -= remainingBudget;
        await shop.save();
      }
    }

    // Soft delete the quest
    await quest.softDelete();

    res.json({
      success: true,
      message: 'Quest deleted successfully',
      refundedAmount: remainingBudget
    });
  } catch (error) {
    console.error('❌ Delete quest error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Update quest status
router.patch('/quests/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const quest = await Quest.findOne({ _id: req.params.id, isDeleted: { $ne: true } });

    if (!quest) {
      return res.status(404).json({ 
        success: false,
        message: 'Quest not found' 
      });
    }

    // Verify ownership for shop owners
    if (req.user.userType === 'shop') {
      const shop = await Shop.findOne({ user: req.user.id });
      if (!shop || quest.shop.toString() !== shop._id.toString()) {
        return res.status(403).json({ 
          success: false,
          message: 'Access denied' 
        });
      }
    }
    // Admin can update any quest status

    quest.status = status;
    
    // Update isActive based on status
    if (status === 'active') {
      quest.isActive = true;
    } else if (status === 'paused' || status === 'completed' || status === 'cancelled') {
      quest.isActive = false;
    }

    await quest.save();
    await quest.populate('template');
    await quest.populate('shop', 'shopName province');

    res.json({
      success: true,
      message: 'Quest status updated successfully',
      data: quest
    });
  } catch (error) {
    console.error('❌ Update quest status error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Review quest submission
router.post('/quests/:id/submissions/:submissionId/review', async (req, res) => {
  try {
    const { status, reviewNotes } = req.body;
    const quest = await Quest.findOne({ _id: req.params.id, isDeleted: { $ne: true } });

    if (!quest) {
      return res.status(404).json({ 
        success: false,
        message: 'Quest not found' 
      });
    }

    // Verify ownership for shop owners
    if (req.user.userType === 'shop') {
      const shop = await Shop.findOne({ user: req.user.id });
      if (!shop || quest.shop.toString() !== shop._id.toString()) {
        return res.status(403).json({ 
          success: false,
          message: 'Access denied' 
        });
      }
    }
    // Admin can review any submission

    const submission = quest.submissions.id(req.params.submissionId);
    if (!submission) {
      return res.status(404).json({ 
        success: false,
        message: 'Submission not found' 
      });
    }

    submission.status = status;
    submission.reviewNotes = reviewNotes;
    submission.reviewedAt = new Date();
    submission.reviewedBy = req.user.id;

    // If approved, update counts and potentially release funds
    if (status === 'approved') {
      quest.currentParticipants += 1;
      await quest.updateTotalSpent();
    }

    await quest.save();

    res.json({
      success: true,
      message: 'Submission reviewed successfully',
      data: submission
    });
  } catch (error) {
    console.error('❌ Review submission error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get quest statistics - Role-based
router.get('/quests-stats', async (req, res) => {
  try {
    let query = { isDeleted: { $ne: true } };
    
    // Filter by shop for shop owners
    if (req.user.userType === 'shop') {
      const shop = await Shop.findOne({ user: req.user.id });
      if (!shop) {
        return res.status(404).json({ 
          success: false,
          message: 'Shop not found' 
        });
      }
      query.shop = shop._id;
    } else if (req.user.userType !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied' 
      });
    }

    const quests = await Quest.find(query);
    
    const stats = {
      totalQuests: quests.length,
      activeQuests: quests.filter(q => q.isActive).length,
      inactiveQuests: quests.filter(q => !q.isActive).length,
      totalBudget: quests.reduce((sum, q) => sum + q.budget, 0),
      totalSpent: quests.reduce((sum, q) => sum + q.totalSpent, 0),
      totalParticipants: quests.reduce((sum, q) => sum + q.currentParticipants, 0),
      pendingSubmissions: quests.reduce((sum, q) => 
        sum + q.submissions.filter(s => s.status === 'pending').length, 0
      ),
      userType: req.user.userType
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Get quest stats error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Admin-only: Get all quests across all shops with advanced filtering
router.get('/admin/quests', async (req, res) => {
  try {
    if (req.user.userType !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Admin only.' 
      });
    }

    const { status, shopId, page = 1, limit = 20, search } = req.query;
    
    let query = { isDeleted: { $ne: true } };
    
    // Advanced filtering for admin
    if (status) query.status = status;
    if (shopId) query.shop = shopId;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const quests = await Quest.find(query)
      .populate('template')
      .populate('shop', 'shopName province phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Quest.countDocuments(query);

    res.json({
      success: true,
      data: quests,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      filters: {
        status,
        shopId,
        search
      }
    });

  } catch (error) {
    console.error('❌ Admin get quests error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get quests by shop owner's user ID - Role-based access
// router.get('/shops/:userId/quests', auth, async (req, res) => {
//   try {
//     console.log(req.params)
//     const { userId } = req.params;
//     const { status, page = 1, limit = 20 } = req.query;

//     console.log(`🔍 Fetching quests for shop owner user: ${userId}, request user type: ${req.user.userType}`);

//     // First, find the shop that belongs to this user
//     const shop = await Quest.findOne({ 
//       user: userId,
//       isDeleted: { $ne: true } 
//     });
//     console.log(shop)
//     if (!shop) {
//       return res.status(404).json({ 
//         success: false,
//         message: 'Shop not found for this user' 
//       });
//     }

//     // Check permissions
//     if (req.user.userType === 'shop') {
//       // Shop owner can only see their own shop's quests
//       if (req.user.id !== userId) {
//         return res.status(403).json({ 
//           success: false,
//           message: 'Access denied. You can only view your own shop quests.' 
//         });
//       }
//     }
//     // Admin can access any shop's quests
//     else if (req.user.userType !== 'admin') {
//       return res.status(403).json({ 
//         success: false,
//         message: 'Access denied. Shop owners and admins only.' 
//       });
//     }

//     // Build query using the shop's ObjectId (from shops collection)
//     let query = { 
//       shop: shop._id, // This is the shop ObjectId that quests reference
//       isDeleted: { $ne: true } 
//     };

//     // Add status filter if provided
//     if (status && status !== 'all') {
//       query.status = status;
//     }

//     console.log(`🔍 Querying quests for shop: ${shop.shopName} (${shop._id})`);

//     // Get quests with pagination
//     const quests = await Quest.find(query)
//       .populate('template', 'name description rewardPoints')
//       .populate('shop', 'shopName province phone')
//       .populate('submissions.user', 'name email')
//       .sort({ createdAt: -1 })
//       .limit(limit * 1)
//       .skip((page - 1) * limit);

//     const total = await Quest.countDocuments(query);

//     // Get quest statistics for this shop
//     const stats = await Quest.aggregate([
//       { $match: { shop: shop._id, isDeleted: { $ne: true } } },
//       {
//         $group: {
//           _id: null,
//           totalQuests: { $sum: 1 },
//           activeQuests: { 
//             $sum: { 
//               $cond: [{ $eq: ['$status', 'active'] }, 1, 0] 
//             } 
//           },
//           completedQuests: { 
//             $sum: { 
//               $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] 
//             } 
//           },
//           totalBudget: { $sum: '$budget' },
//           totalSpent: { $sum: '$totalSpent' },
//           totalParticipants: { $sum: '$currentParticipants' },
//           totalSubmissions: { 
//             $sum: { $size: '$submissions' } 
//           }
//         }
//       }
//     ]);

//     const shopStats = stats[0] || {
//       totalQuests: 0,
//       activeQuests: 0,
//       completedQuests: 0,
//       totalBudget: 0,
//       totalSpent: 0,
//       totalParticipants: 0,
//       totalSubmissions: 0
//     };

//     console.log(`✅ Found ${quests.length} quests for shop ${shop.shopName}`);

//     res.json({
//       success: true,
//       data: quests,
//       statistics: shopStats,
//       shopInfo: {
//         shopId: shop.shopId,
//         shopName: shop.shopName,
//         ownerUserId: shop.user,
//         status: shop.status
//       },
//       pagination: {
//         current: parseInt(page),
//         pages: Math.ceil(total / limit),
//         total
//       },
//       filters: {
//         status,
//         userId
//       }
//     });

//   } catch (error) {
//     console.error('❌ Get quests by shop owner user ID error:', error);
//     res.status(500).json({ 
//       success: false,
//       message: 'Server error fetching quests', 
//       error: error.message 
//     });
//   }
// });

// Admin-only: Get quest statistics across all shops
router.get('/admin/quests-stats', async (req, res) => {
  try {
    if (req.user.userType !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Admin only.' 
      });
    }

    const quests = await Quest.find({ isDeleted: { $ne: true } })
      .populate('shop', 'shopName province');
    
    const stats = {
      totalQuests: quests.length,
      activeQuests: quests.filter(q => q.isActive).length,
      completedQuests: quests.filter(q => q.status === 'completed').length,
      pausedQuests: quests.filter(q => q.status === 'paused').length,
      totalBudget: quests.reduce((sum, q) => sum + q.budget, 0),
      totalSpent: quests.reduce((sum, q) => sum + q.totalSpent, 0),
      totalParticipants: quests.reduce((sum, q) => sum + q.currentParticipants, 0),
      totalSubmissions: quests.reduce((sum, q) => sum + q.submissions.length, 0),
      pendingSubmissions: quests.reduce((sum, q) => 
        sum + q.submissions.filter(s => s.status === 'pending').length, 0
      ),
      shopsWithQuests: [...new Set(quests.map(q => q.shop?._id?.toString()).filter(Boolean))].length
    };

    // Shop-wise breakdown
    const shopStats = {};
    quests.forEach(quest => {
      if (quest.shop) {
        const shopId = quest.shop._id.toString();
        if (!shopStats[shopId]) {
          shopStats[shopId] = {
            shopName: quest.shop.shopName,
            province: quest.shop.province,
            totalQuests: 0,
            totalBudget: 0,
            totalParticipants: 0
          };
        }
        shopStats[shopId].totalQuests += 1;
        shopStats[shopId].totalBudget += quest.budget;
        shopStats[shopId].totalParticipants += quest.currentParticipants;
      }
    });

    res.json({
      success: true,
      data: {
        overview: stats,
        byShop: Object.values(shopStats)
      }
    });

  } catch (error) {
    console.error('❌ Admin quests stats error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Create quest from template
// In backend/routes/shopQuests.js - Update the POST /quests route
router.post('/quests', auth, async (req, res) => {
  try {
    console.log('🔄 Creating quest for user:', req.user);
    console.log("show data:",req.body)
    
    // Only allow shop owners and admins
    if (req.user.userType !== 'shop' && req.user.userType !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Shop owners and admins only.' 
      });
    }

    const { templateId,shopId, budget, maxParticipants, duration } = req.body;
    
    // Validate required fields
    if (!templateId || !budget || !maxParticipants || !shopId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: templateId, budget, maxParticipants, shopId'
      });
    }

    // Get template
    const template = await QuestTemplate.findById(templateId);
    if (!template) {
      return res.status(404).json({ 
        success: false,
        message: 'Template not found' 
      });
    }

    // Verify the shop exists by shopId
    const shop = await Shop.findOne({ shopId: shopId });
    if (!shop) {
      return res.status(404).json({ 
        success: false,
        message: `Shop not found with ID: ${shopId}` 
      });
    }

    // Check permissions for shop owners
    if (req.user.userType === 'shop') {
      // Shop owner can only create quests for their own shops
      const userShop = await Shop.find({ user: req.user._id, shopId: shopId});
      console.log(userShop)
      if (!userShop || userShop[0].shopId !== shopId) {
        return res.status(403).json({ 
          success: false,
          message: 'Access denied. You can only create quests for your own shop.' 
        });
      }
    }

    // Calculate reward amount per participant
    const rewardAmount = parseFloat(budget) / parseInt(maxParticipants);
    
    // Generate QR code
    const generateQRCode = () => {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substr(2, 8);
      return `QR-${timestamp}-${random}`;
    };

    // Create quest with shopId string and shop ObjectId
    const quest = new Quest({
      name: template.name,
      description: template.description,
      template: templateId,
      shopId: shopId, // Store the string shopId
      shop: shop._id, // Also store the ObjectId for relationships
      budget: parseFloat(budget),
      rewardAmount: rewardAmount,
      rewardPoints: template.rewardPoints,
      maxParticipants: parseInt(maxParticipants),
      duration: parseInt(duration) || 7,
      status: 'active',
      isActive: true,
      createdBy: req.user._id,
      startDate: new Date(),
      endDate: new Date(Date.now() + (parseInt(duration) || 7) * 24 * 60 * 60 * 1000),
      qrCode: generateQRCode(),
      submissions: [],
      currentParticipants: 0,
      totalSpent: 0,
      isDeleted: false
    });

    await quest.save();
    
    // Populate related data
    await quest.populate('template');
    await quest.populate('shop', 'shopName province shopId');
    await quest.populate('createdBy', 'name email');

    console.log('✅ Quest created:', {
      id: quest._id,
      name: quest.name,
      shopId: quest.shopId,
      shop: quest.shop?.shopName,
      userType: req.user.userType,
      budget: quest.budget,
      participants: quest.maxParticipants
    });

    res.status(201).json({
      success: true,
      message: 'Quest created successfully',
      data: quest
    });

  } catch (error) {
    console.error('❌ Create quest error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

module.exports = router;