// backend/middleware/partnerAuth.js
exports.partnerAuth = (req, res, next) => {
  if (req.user.userType !== 'partner') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Partner role required.'
    });
  }
  next();
};