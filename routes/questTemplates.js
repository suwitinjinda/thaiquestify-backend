// backend/routes/questTemplates.js
const express = require('express');
const router = express.Router();
const QuestTemplate = require('../models/QuestTemplate');
const { auth } = require('../middleware/auth');

// Get all quest templates
router.get('/', auth, async (req, res) => {
  try {
    const templates = await QuestTemplate.find({ isActive: true })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get quest template by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const template = await QuestTemplate.findById(req.params.id)
      .populate('createdBy', 'name email');
    
    if (!template) {
      return res.status(404).json({ message: 'Quest template not found' });
    }
    
    res.json(template);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new quest template (Admin only)
// router.post('/', auth, async (req, res) => {
//   try {
//     // Check if user is admin
//     if (req.user.userType !== 'admin') {
//       return res.status(403).json({ message: 'Access denied. Admin only.' });
//     }

//     const template = new QuestTemplate({
//       ...req.body,
//       createdBy: req.user.userId
//     });

//     await template.save();
//     await template.populate('createdBy', 'name email');
    
//     res.status(201).json(template);
//   } catch (error) {
//     res.status(400).json({ message: 'Error creating template', error: error.message });
//   }
// });

// backend/routes/questTemplates.js
// In your routes/questTemplates.js - Update the POST route
router.post('/', auth, async (req, res) => {
  try {
    console.log('📥 Received template data:', JSON.stringify(req.body, null, 2));
    console.log('👤 Authenticated user:', req.user);
    
    if (req.user.userType !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    // Convert requiredData to Map if it's an object
    let requiredData = new Map();
    let templateConfig = new Map();
    
    if (req.body.requiredData && typeof req.body.requiredData === 'object') {
      requiredData = new Map(Object.entries(req.body.requiredData));
    }
    
    if (req.body.templateConfig && typeof req.body.templateConfig === 'object') {
      templateConfig = new Map(Object.entries(req.body.templateConfig));
    }

    console.log('📦 Processed requiredData:', Object.fromEntries(requiredData));
    console.log('📦 Processed templateConfig:', Object.fromEntries(templateConfig));

    // Create template with processed data
    const template = new QuestTemplate({
      ...req.body,
      requiredData: requiredData,
      templateConfig: templateConfig,
      createdBy: req.user._id
    });

    console.log('📝 Creating template with createdBy:', template.createdBy);
    
    await template.save();
    
    // Populate createdBy field before sending response
    await template.populate('createdBy', 'name email');
    
    console.log('✅ Template created successfully:', {
      name: template.name,
      type: template.type,
      requiredData: Object.fromEntries(template.requiredData || new Map()),
      templateConfig: Object.fromEntries(template.templateConfig || new Map())
    });
    
    res.status(201).json(template);
  } catch (error) {
    console.error('❌ Error creating template:', error);
    
    let errorMessage = 'Error creating template';
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      errorMessage = `Validation failed: ${errors.join(', ')}`;
    }
    
    res.status(400).json({ 
      message: errorMessage, 
      error: error.message
    });
  }
});

// Add a GET route to get Facebook templates specifically
router.get('/type/facebook', auth, async (req, res) => {
  try {
    const templates = await QuestTemplate.findFacebookTemplates()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add a GET route to get Location templates specifically
router.get('/type/location', auth, async (req, res) => {
  try {
    const templates = await QuestTemplate.findLocationTemplates()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update quest template (Admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const template = await QuestTemplate.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    if (!template) {
      return res.status(404).json({ message: 'Quest template not found' });
    }

    res.json(template);
  } catch (error) {
    res.status(400).json({ message: 'Error updating template', error: error.message });
  }
});

// Toggle template status (Admin only)
router.patch('/:id/toggle', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const template = await QuestTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ message: 'Quest template not found' });
    }

    template.isActive = !template.isActive;
    await template.save();
    await template.populate('createdBy', 'name email');

    res.json(template);
  } catch (error) {
    res.status(400).json({ message: 'Error updating template', error: error.message });
  }
});

// Delete quest template (Admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const template = await QuestTemplate.findByIdAndDelete(req.params.id);
    if (!template) {
      return res.status(404).json({ message: 'Quest template not found' });
    }

    res.json({ message: 'Quest template deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;