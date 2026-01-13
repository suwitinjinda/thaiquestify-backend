// backend/middleware/partnerAuth.js
exports.partnerAuth = (req, res, next) => {
  // Check if user has partnerId (they are a partner)
  // Note: userType can be 'admin', 'customer', etc. - we check partnerId instead
  if (!req.user || !req.user.partnerId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Partner role required.'
    });
  }
  next();
};