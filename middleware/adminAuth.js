// backend/middleware/adminAuth.js
exports.adminAuth = (req, res, next) => {
  // Check if req.user exists (should be set by auth middleware)
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Please authenticate first.'
    });
  }
  
  // Check if user is admin
  if (req.user.userType !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.'
    });
  }
  next();
};