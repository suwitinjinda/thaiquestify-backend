// services/autoCoordinateUpdateService.js
/**
 * Auto Coordinate Update Service
 * Automatically updates tourist attraction coordinates based on user check-in locations
 */

const TouristAttraction = require('../models/TouristAttraction');

/**
 * Add a check-in location to an attraction
 * @param {string} attractionId - The attraction ID
 * @param {number} latitude - User's check-in latitude
 * @param {number} longitude - User's check-in longitude
 * @param {string} userId - User ID who checked in
 * @param {number} distance - Distance from original coordinates in meters
 * @returns {Promise<{success: boolean, updated: boolean, message?: string}>}
 */
const addCheckInLocation = async (attractionId, latitude, longitude, userId, distance = null) => {
  try {
    const attraction = await TouristAttraction.findOne({ id: attractionId });

    if (!attraction) {
      return {
        success: false,
        updated: false,
        message: 'Tourist attraction not found'
      };
    }

    // Check if auto-update is enabled
    if (!attraction.autoUpdateEnabled) {
      return {
        success: true,
        updated: false,
        message: 'Auto-update is disabled for this attraction'
      };
    }

    // Add check-in location
    attraction.checkInLocations = attraction.checkInLocations || [];
    attraction.checkInLocations.push({
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      userId: userId,
      checkedInAt: new Date(),
      distance: distance
    });

    // Keep only last 100 check-ins to prevent array from growing too large
    if (attraction.checkInLocations.length > 100) {
      attraction.checkInLocations = attraction.checkInLocations.slice(-100);
    }

    await attraction.save();

    // Check if we should update coordinates
    const minCheckIns = attraction.minCheckInsForUpdate || 5;
    if (attraction.checkInLocations.length >= minCheckIns) {
      const updateResult = await updateCoordinatesFromCheckIns(attractionId);
      return {
        success: true,
        updated: updateResult.updated,
        message: updateResult.message
      };
    }

    return {
      success: true,
      updated: false,
      message: `Check-in recorded. ${attraction.checkInLocations.length}/${minCheckIns} check-ins needed for auto-update.`
    };
  } catch (error) {
    console.error('Error adding check-in location:', error);
    return {
      success: false,
      updated: false,
      message: error.message
    };
  }
};

/**
 * Calculate average coordinates from check-in locations
 * @param {Array} checkInLocations - Array of check-in location objects
 * @returns {{latitude: number, longitude: number, count: number}}
 */
const calculateAverageCoordinates = (checkInLocations) => {
  if (!checkInLocations || checkInLocations.length === 0) {
    return null;
  }

  let sumLat = 0;
  let sumLng = 0;
  let count = 0;

  checkInLocations.forEach(location => {
    if (location.latitude && location.longitude) {
      sumLat += parseFloat(location.latitude);
      sumLng += parseFloat(location.longitude);
      count++;
    }
  });

  if (count === 0) {
    return null;
  }

  return {
    latitude: sumLat / count,
    longitude: sumLng / count,
    count: count
  };
};

/**
 * Update attraction coordinates based on check-in locations
 * @param {string} attractionId - The attraction ID
 * @returns {Promise<{success: boolean, updated: boolean, message?: string, oldCoordinates?: object, newCoordinates?: object}>}
 */
const updateCoordinatesFromCheckIns = async (attractionId) => {
  try {
    const attraction = await TouristAttraction.findOne({ id: attractionId });

    if (!attraction) {
      return {
        success: false,
        updated: false,
        message: 'Tourist attraction not found'
      };
    }

    if (!attraction.autoUpdateEnabled) {
      return {
        success: true,
        updated: false,
        message: 'Auto-update is disabled'
      };
    }

    const checkInLocations = attraction.checkInLocations || [];
    const minCheckIns = attraction.minCheckInsForUpdate || 5;

    if (checkInLocations.length < minCheckIns) {
      return {
        success: true,
        updated: false,
        message: `Not enough check-ins. Need ${minCheckIns}, have ${checkInLocations.length}`
      };
    }

    // Calculate average coordinates from recent check-ins
    // Use only last 50 check-ins for calculation to get more recent data
    const recentCheckIns = checkInLocations.slice(-50);
    const avgCoords = calculateAverageCoordinates(recentCheckIns);

    if (!avgCoords) {
      return {
        success: false,
        updated: false,
        message: 'Could not calculate average coordinates'
      };
    }

    // Calculate distance from original coordinates
    const locationVerificationService = require('../service/locationVerificationService');
    const distanceFromOriginal = locationVerificationService.calculateDistance(
      {
        latitude: attraction.coordinates.latitude,
        longitude: attraction.coordinates.longitude
      },
      {
        latitude: avgCoords.latitude,
        longitude: avgCoords.longitude
      }
    );

    // Only update if the average is significantly different (more than 10 meters)
    // This prevents unnecessary updates from minor GPS variations
    const updateThreshold = 10; // meters

    if (distanceFromOriginal < updateThreshold) {
      return {
        success: true,
        updated: false,
        message: `Average coordinates too close to original (${distanceFromOriginal.toFixed(1)}m). No update needed.`
      };
    }

    // Store old coordinates for reference
    const oldCoordinates = {
      latitude: attraction.coordinates.latitude,
      longitude: attraction.coordinates.longitude
    };

    // Update coordinates
    attraction.coordinates.latitude = avgCoords.latitude;
    attraction.coordinates.longitude = avgCoords.longitude;
    attraction.coordinateSource = 'auto_update';
    attraction.lastAutoUpdateAt = new Date();

    await attraction.save();

    console.log(`✅ Auto-updated coordinates for ${attraction.name}:`, {
      old: oldCoordinates,
      new: {
        latitude: avgCoords.latitude,
        longitude: avgCoords.longitude
      },
      distance: distanceFromOriginal.toFixed(1) + 'm',
      checkInsUsed: avgCoords.count
    });

    return {
      success: true,
      updated: true,
      message: `Coordinates updated based on ${avgCoords.count} check-ins`,
      oldCoordinates: oldCoordinates,
      newCoordinates: {
        latitude: avgCoords.latitude,
        longitude: avgCoords.longitude
      },
      distanceFromOriginal: distanceFromOriginal,
      checkInsUsed: avgCoords.count
    };
  } catch (error) {
    console.error('Error updating coordinates from check-ins:', error);
    return {
      success: false,
      updated: false,
      message: error.message
    };
  }
};

/**
 * Get check-in statistics for an attraction
 * @param {string} attractionId - The attraction ID
 * @returns {Promise<{success: boolean, stats?: object}>}
 */
const getCheckInStats = async (attractionId) => {
  try {
    const attraction = await TouristAttraction.findOne({ id: attractionId });

    if (!attraction) {
      return {
        success: false,
        message: 'Tourist attraction not found'
      };
    }

    const checkInLocations = attraction.checkInLocations || [];
    const minCheckIns = attraction.minCheckInsForUpdate || 5;

    const avgCoords = calculateAverageCoordinates(checkInLocations);

    return {
      success: true,
      stats: {
        totalCheckIns: checkInLocations.length,
        minCheckInsForUpdate: minCheckIns,
        checkInsRemaining: Math.max(0, minCheckIns - checkInLocations.length),
        autoUpdateEnabled: attraction.autoUpdateEnabled,
        lastAutoUpdateAt: attraction.lastAutoUpdateAt,
        currentCoordinates: attraction.coordinates,
        averageCoordinates: avgCoords,
        coordinateSource: attraction.coordinateSource
      }
    };
  } catch (error) {
    console.error('Error getting check-in stats:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

module.exports = {
  addCheckInLocation,
  updateCoordinatesFromCheckIns,
  calculateAverageCoordinates,
  getCheckInStats
};
