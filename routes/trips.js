const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip');
const { auth } = require('../middleware/auth');

/**
 * GET /api/trips
 * Get all trips for the authenticated user
 */
router.get('/', auth, async (req, res) => {
  try {
    const trips = await Trip.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    // Convert to JSON format with id field
    const tripsData = trips.map(trip => {
      const tripObj = trip.toObject ? trip.toObject() : trip.toJSON();
      if (trip._id) {
        tripObj.id = trip._id.toString();
      } else if (tripObj._id) {
        tripObj.id = tripObj._id.toString();
      }
      if (tripObj._id) delete tripObj._id;
      if (tripObj.__v !== undefined) delete tripObj.__v;
      return tripObj;
    });

    return res.json({
      success: true,
      data: tripsData,
      message: 'Trips retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching trips:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch trips',
      error: error.message
    });
  }
});

/**
 * GET /api/trips/:id
 * Get a specific trip by ID
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const trip = await Trip.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Convert to response format
    const tripData = trip.toObject ? trip.toObject() : trip.toJSON();
    tripData.id = trip._id ? trip._id.toString() : tripData._id?.toString();
    if (tripData._id) delete tripData._id;
    if (tripData.__v !== undefined) delete tripData.__v;

    return res.json({
      success: true,
      data: tripData,
      message: 'Trip retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching trip:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch trip',
      error: error.message
    });
  }
});

/**
 * POST /api/trips
 * Create a new trip
 */
router.post('/', auth, async (req, res) => {
  try {
    const { name, date, places } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Trip name is required'
      });
    }

    const tripData = {
      userId: req.user._id,
      name: name.trim(),
      date: date || new Date().toISOString().split('T')[0],
      places: places || []
    };

    const trip = new Trip(tripData);
    await trip.save();

    // Convert to response format - use the document's _id directly
    if (!trip || !trip._id) {
      console.error('Trip save failed - trip or _id is missing');
      return res.status(500).json({
        success: false,
        message: 'Failed to create trip - invalid trip data'
      });
    }

    const tripDataResponse = trip.toObject ? trip.toObject() : trip.toJSON();
    tripDataResponse.id = trip._id.toString();
    if (tripDataResponse._id) delete tripDataResponse._id;
    if (tripDataResponse.__v !== undefined) delete tripDataResponse.__v;

    return res.status(201).json({
      success: true,
      data: tripDataResponse,
      message: 'Trip created successfully'
    });
  } catch (error) {
    console.error('Error creating trip:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      message: 'Failed to create trip',
      error: error.message
    });
  }
});

/**
 * PUT /api/trips/:id
 * Update an existing trip
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, date, places } = req.body;

    const trip = await Trip.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Update fields
    if (name !== undefined) trip.name = name.trim();
    if (date !== undefined) trip.date = date;
    if (places !== undefined) trip.places = places;
    trip.updatedAt = new Date();

    await trip.save();

    // Convert to response format
    const tripDataResponse = trip.toObject ? trip.toObject() : trip.toJSON();
    if (trip._id) {
      tripDataResponse.id = trip._id.toString();
    } else if (tripDataResponse._id) {
      tripDataResponse.id = tripDataResponse._id.toString();
    }
    if (tripDataResponse._id) delete tripDataResponse._id;
    if (tripDataResponse.__v !== undefined) delete tripDataResponse.__v;

    return res.json({
      success: true,
      data: tripDataResponse,
      message: 'Trip updated successfully'
    });
  } catch (error) {
    console.error('Error updating trip:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update trip',
      error: error.message
    });
  }
});

/**
 * DELETE /api/trips/:id
 * Delete a trip
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const trip = await Trip.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    return res.json({
      success: true,
      message: 'Trip deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting trip:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete trip',
      error: error.message
    });
  }
});

/**
 * POST /api/trips/:id/places
 * Add a place to a trip
 */
router.post('/:id/places', auth, async (req, res) => {
  try {
    const { place } = req.body;

    if (!place) {
      return res.status(400).json({
        success: false,
        message: 'Place data is required'
      });
    }

    const trip = await Trip.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Check if place already exists
    const placeExists = trip.places.some(p => p.id === place.id);
    if (placeExists) {
      return res.status(400).json({
        success: false,
        message: 'Place already exists in this trip'
      });
    }

    // Add place to trip
    trip.places.push(place);
    trip.updatedAt = new Date();
    await trip.save();

    // Convert to response format
    const tripDataResponse = trip.toObject ? trip.toObject() : trip.toJSON();
    if (trip._id) {
      tripDataResponse.id = trip._id.toString();
    } else if (tripDataResponse._id) {
      tripDataResponse.id = tripDataResponse._id.toString();
    }
    if (tripDataResponse._id) delete tripDataResponse._id;
    if (tripDataResponse.__v !== undefined) delete tripDataResponse.__v;

    return res.json({
      success: true,
      data: tripDataResponse,
      message: 'Place added to trip successfully'
    });
  } catch (error) {
    console.error('Error adding place to trip:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add place to trip',
      error: error.message
    });
  }
});

/**
 * DELETE /api/trips/:id/places/:placeId
 * Remove a place from a trip
 */
router.delete('/:id/places/:placeId', auth, async (req, res) => {
  try {
    const trip = await Trip.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Remove place from trip
    trip.places = trip.places.filter(p => p.id !== req.params.placeId);
    trip.updatedAt = new Date();
    await trip.save();

    // Convert to response format
    const tripDataResponse = trip.toObject ? trip.toObject() : trip.toJSON();
    if (trip._id) {
      tripDataResponse.id = trip._id.toString();
    } else if (tripDataResponse._id) {
      tripDataResponse.id = tripDataResponse._id.toString();
    }
    if (tripDataResponse._id) delete tripDataResponse._id;
    if (tripDataResponse.__v !== undefined) delete tripDataResponse.__v;

    return res.json({
      success: true,
      data: tripDataResponse,
      message: 'Place removed from trip successfully'
    });
  } catch (error) {
    console.error('Error removing place from trip:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to remove place from trip',
      error: error.message
    });
  }
});

/**
 * PUT /api/trips/:id/places/reorder
 * Reorder places in a trip
 */
router.put('/:id/places/reorder', auth, async (req, res) => {
  try {
    const { places } = req.body;

    if (!places || !Array.isArray(places)) {
      return res.status(400).json({
        success: false,
        message: 'Places array is required'
      });
    }

    const trip = await Trip.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Update places order
    trip.places = places;
    trip.updatedAt = new Date();
    await trip.save();

    // Convert to response format
    const tripDataResponse = trip.toObject ? trip.toObject() : trip.toJSON();
    if (trip._id) {
      tripDataResponse.id = trip._id.toString();
    } else if (tripDataResponse._id) {
      tripDataResponse.id = tripDataResponse._id.toString();
    }
    if (tripDataResponse._id) delete tripDataResponse._id;
    if (tripDataResponse.__v !== undefined) delete tripDataResponse.__v;

    return res.json({
      success: true,
      data: tripDataResponse,
      message: 'Places reordered successfully'
    });
  } catch (error) {
    console.error('Error reordering places:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reorder places',
      error: error.message
    });
  }
});

module.exports = router;
