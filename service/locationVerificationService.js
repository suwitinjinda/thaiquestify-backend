const locationVerificationService = {
  // Calculate distance between two coordinates using Haversine formula
  // Accepts both string format "lat,lng" and object format {latitude, longitude}
  calculateDistance: (coord1, coord2) => {
    let lat1, lon1, lat2, lon2;

    // Parse coord1
    if (typeof coord1 === 'string') {
      [lat1, lon1] = coord1.split(',').map(Number);
    } else if (coord1.latitude !== undefined && coord1.longitude !== undefined) {
      lat1 = coord1.latitude;
      lon1 = coord1.longitude;
    } else {
      throw new Error('Invalid coordinate format for coord1');
    }

    // Parse coord2
    if (typeof coord2 === 'string') {
      [lat2, lon2] = coord2.split(',').map(Number);
    } else if (coord2.latitude !== undefined && coord2.longitude !== undefined) {
      lat2 = coord2.latitude;
      lon2 = coord2.longitude;
    } else {
      throw new Error('Invalid coordinate format for coord2');
    }

    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  },

  // Verify if user is within the required radius of the location
  verifyLocation: async (userCoordinates, targetCoordinates, radiusMeters) => {
    try {
      const distance = locationVerificationService.calculateDistance(userCoordinates, targetCoordinates);
      const isValid = distance <= radiusMeters;
      return {
        isValid,
        distance,
        radius: radiusMeters,
        withinRadius: isValid
      };
    } catch (error) {
      console.error('Location verification error:', error);
      return {
        isValid: false,
        distance: null,
        radius: radiusMeters,
        withinRadius: false,
        error: error.message
      };
    }
  }
};

module.exports = locationVerificationService;