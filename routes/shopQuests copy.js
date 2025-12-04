// backend/routes/shopQuests.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Quest = require('../models/Quest');
const QuestTemplate = require('../models/QuestTemplate');
const Shop = require('../models/Shop');

// Create quest from template
// Remove auth from specific routes for testing
router.post('/quests', async (req, res) => { // Remove 'auth' parameter
  try {
    console.log('🔄 Creating quest (NO AUTH)');
    
    // For testing, use a mock shop ID
    const mockShopId = '65a1b2c3d4e5f67890123456';
    
    const { templateId, budget, maxParticipants, duration } = req.body;
    
    // Get template
    const template = await QuestTemplate.findById(templateId);
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Create quest with mock shop
    const quest = new Quest({
      name: template.name,
      description: template.description,
      template: templateId,
      shop: mockShopId,
      budget,
      rewardAmount: budget / maxParticipants,
      rewardPoints: template.rewardPoints,
      maxParticipants,
      duration
    });

    await quest.save();
    await quest.populate('template');

    console.log('✅ Quest created (NO AUTH):', quest._id);

    res.status(201).json({
      message: 'Quest created successfully (TEST MODE)',
      quest
    });

  } catch (error) {
    console.error('Create quest error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get shop's quests (only non-deleted)
router.get('/quests', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'shop') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const shop = await Shop.findOne({ user: req.user.id });
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    const quests = await Quest.find({ shop: shop._id })
      .populate('template')
      .sort({ createdAt: -1 });

    res.json(quests);
  } catch (error) {
    console.error('Get shop quests error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get quest by ID
router.get('/quests/:id', auth, async (req, res) => {
  try {
    const quest = await Quest.findOne({ _id: req.params.id, isDeleted: { $ne: true } })
      .populate('template')
      .populate('shop')
      .populate('submissions.user', 'name email');

    if (!quest) {
      return res.status(404).json({ message: 'Quest not found' });
    }

    // Verify ownership
    const shop = await Shop.findOne({ user: req.user.id });
    if (quest.shop._id.toString() !== shop._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(quest);
  } catch (error) {
    console.error('Get quest error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Toggle quest active status (activate/deactivate)
router.patch('/quests/:id/toggle-active', auth, async (req, res) => {
  try {
    const quest = await Quest.findOne({ _id: req.params.id, isDeleted: { $ne: true } });

    if (!quest) {
      return res.status(404).json({ message: 'Quest not found' });
    }

    // Verify ownership
    const shop = await Shop.findOne({ user: req.user.id });
    if (quest.shop.toString() !== shop._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Toggle isActive status
    quest.isActive = !quest.isActive;
    
    // Also update status field for consistency
    if (!quest.isActive) {
      quest.status = 'paused';
    } else {
      quest.status = 'active';
    }

    await quest.save();

    res.json({ 
      message: `Quest ${quest.isActive ? 'activated' : 'deactivated'} successfully`,
      quest 
    });
  } catch (error) {
    console.error('Toggle quest active status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update quest
router.put('/quests/:id', auth, async (req, res) => {
  try {
    const { name, description, budget, maxParticipants, duration } = req.body;
    
    const quest = await Quest.findOne({ _id: req.params.id, isDeleted: { $ne: true } });

    if (!quest) {
      return res.status(404).json({ message: 'Quest not found' });
    }

    // Verify ownership
    const shop = await Shop.findOne({ user: req.user.id });
    if (quest.shop.toString() !== shop._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if quest has submissions (restrict editing if it does)
    if (quest.submissions.length > 0) {
      return res.status(400).json({ 
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

    // Handle budget changes
    if (budget && budget !== quest.budget) {
      const budgetDifference = budget - quest.budget;
      
      if (budgetDifference > 0) {
        // Increase budget - check if shop has enough balance
        if (shop.balance < budgetDifference) {
          return res.status(400).json({ 
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

    res.json({ 
      message: 'Quest updated successfully',
      quest 
    });
  } catch (error) {
    console.error('Update quest error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete quest (soft delete)
router.delete('/quests/:id', auth, async (req, res) => {
  try {
    const quest = await Quest.findOne({ _id: req.params.id, isDeleted: { $ne: true } });

    if (!quest) {
      return res.status(404).json({ message: 'Quest not found' });
    }

    // Verify ownership
    const shop = await Shop.findOne({ user: req.user.id });
    if (quest.shop.toString() !== shop._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if quest has approved submissions
    const hasApprovedSubmissions = quest.submissions.some(sub => sub.status === 'approved');
    if (hasApprovedSubmissions) {
      return res.status(400).json({ 
        message: 'Cannot delete quest with approved submissions' 
      });
    }

    // Return reserved funds to shop balance
    const remainingBudget = quest.budget - quest.totalSpent;
    if (remainingBudget > 0) {
      shop.balance += remainingBudget;
      shop.reservedBalance -= remainingBudget;
      await shop.save();
    }

    // Soft delete the quest
    await quest.softDelete();

    res.json({ 
      message: 'Quest deleted successfully',
      refundedAmount: remainingBudget
    });
  } catch (error) {
    console.error('Delete quest error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update quest status
router.patch('/quests/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const quest = await Quest.findOne({ _id: req.params.id, isDeleted: { $ne: true } });

    if (!quest) {
      return res.status(404).json({ message: 'Quest not found' });
    }

    // Verify ownership
    const shop = await Shop.findOne({ user: req.user.id });
    if (quest.shop.toString() !== shop._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    quest.status = status;
    
    // Update isActive based on status
    if (status === 'active') {
      quest.isActive = true;
    } else if (status === 'paused' || status === 'completed' || status === 'cancelled') {
      quest.isActive = false;
    }

    await quest.save();

    res.json({ message: 'Quest status updated', quest });
  } catch (error) {
    console.error('Update quest status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Review quest submission
router.post('/quests/:id/submissions/:submissionId/review', auth, async (req, res) => {
  try {
    const { status, reviewNotes } = req.body;
    const quest = await Quest.findOne({ _id: req.params.id, isDeleted: { $ne: true } });

    if (!quest) {
      return res.status(404).json({ message: 'Quest not found' });
    }

    // Verify ownership
    const shop = await Shop.findOne({ user: req.user.id });
    if (quest.shop.toString() !== shop._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const submission = quest.submissions.id(req.params.submissionId);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    submission.status = status;
    submission.reviewNotes = reviewNotes;
    submission.reviewedAt = new Date();

    // If approved, update counts and potentially release funds
    if (status === 'approved') {
      quest.currentParticipants += 1;
      await quest.updateTotalSpent();
    }

    await quest.save();

    res.json({ message: 'Submission reviewed', submission });
  } catch (error) {
    console.error('Review submission error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get quest statistics
router.get('/quests-stats', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'shop') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const shop = await Shop.findOne({ user: req.user.id });
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    const quests = await Quest.find({ shop: shop._id });
    
    const stats = {
      totalQuests: quests.length,
      activeQuests: quests.filter(q => q.isActive).length,
      inactiveQuests: quests.filter(q => !q.isActive).length,
      totalBudget: quests.reduce((sum, q) => sum + q.budget, 0),
      totalSpent: quests.reduce((sum, q) => sum + q.totalSpent, 0),
      totalParticipants: quests.reduce((sum, q) => sum + q.currentParticipants, 0),
      pendingSubmissions: quests.reduce((sum, q) => 
        sum + q.submissions.filter(s => s.status === 'pending').length, 0
      )
    };

    res.json(stats);
  } catch (error) {
    console.error('Get quest stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;