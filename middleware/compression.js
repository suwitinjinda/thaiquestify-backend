// middleware/compression.js
// Response compression middleware for better performance

const compression = require('compression');

// Compression configuration
const compressionMiddleware = compression({
  // Only compress responses above this threshold
  threshold: 1024, // 1KB
  // Compression level (0-9, where 9 is maximum compression)
  level: 6,
  // Filter function to decide which responses to compress
  filter: (req, res) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use compression filter
    return compression.filter(req, res);
  },
});

module.exports = compressionMiddleware;
