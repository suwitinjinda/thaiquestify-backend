// backend/controllers/shopController.js
const Shop = require('../models/Shop');
const User = require('../models/User');

// Update shop status (admin only)
exports.updateShopStatus = async (req, res) => {
  try {
    const { shopId } = req.params;
    const { status, rejectionReason } = req.body;
    const adminId = req.user.id;

    const shop = await Shop.findOne({ shopId });
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    shop.status = status;
    if (status === 'approved') {
      shop.approvedAt = new Date();
      shop.approvedBy = adminId;
    } else if (status === 'rejected') {
      shop.rejectionReason = rejectionReason;
    }

    await shop.save();

    res.json({
      success: true,
      message: `Shop ${status} successfully`,
      data: shop
    });

  } catch (error) {
    console.error('Update shop status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get shop statistics
exports.getShopStatistics = async (req, res) => {
  try {
    const totalShops = await Shop.countDocuments();
    const activeShops = await Shop.countDocuments({ status: 'active' });
    const pendingShops = await Shop.countDocuments({ status: 'pending' });
    const rejectedShops = await Shop.countDocuments({ status: 'rejected' });

    // Shops by province
    const shopsByProvince = await Shop.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$province', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Shops by type
    const shopsByType = await Shop.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$shopType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        totalShops,
        activeShops,
        pendingShops,
        rejectedShops,
        shopsByProvince,
        shopsByType
      }
    });

  } catch (error) {
    console.error('Get shop statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

exports.getAllShops = async (req, res) => {
  try {
    console.log('🔍 Fetching shops for user type:', req.user.userType);

    let shops;
    console.log(req.user)
    // const shops1 = await Shop.find({})
    // console.log(shops1)
    // Admin can see all shops
    if (req.user.userType === 'admin') {
      shops = await Shop.find({ isDeleted: { $ne: true } })
        .populate('ownerEmail', 'name email')
        .populate('partnerId', 'name email')
        .sort({ createdAt: -1 });
    }
    // Shop owner can only see their own shop
    else if (req.user.userType === 'shop') {
      shops = await Shop.find({
        user: req.user._id,
        isDeleted: { $ne: true }
      })
        .populate('ownerEmail', 'name email')
        .populate('partnerId', 'name email')
        .sort({ createdAt: -1 });

      console.log(shops)
    }
    // Other users not allowed
    else {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Shop owners and admins only.'
      });
    }

    console.log(`✅ Found ${shops.length} shops for ${req.user.userType}`);

    res.json({
      success: true,
      data: shops,
      count: shops.length
    });

  } catch (error) {
    console.error('❌ Get shops error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching shops',
      error: error.message
    });
  }
};
