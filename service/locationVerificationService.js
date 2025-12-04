const locationVerificationService = {
  // Verify if user is within the required radius of the location
  verifyLocation: async (userCoordinates, targetCoordinates, radiusMeters) => {
    try {
      const distance = calculateDistance(userCoordinates, targetCoordinates);
      return distance <= radiusMeters;
    } catch (error) {
      console.error('Location verification error:', error);
      return false;
    }
  },

  // Calculate distance between two coordinates using Haversine formula
  calculateDistance: (coord1, coord2) => {
    const [lat1, lon1] = coord1.split(',').map(Number);
    const [lat2, lon2] = coord2.split(',').map(Number);
    
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance;
  }
};

module.exports = locationVerificationService;