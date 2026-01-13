const PointSystem = require('../models/PointSystem');
const PointTransaction = require('../models/PointTransaction');

/**
 * Point System Service
 * Handles all point system operations
 */

/**
 * Use points when user claims reward or quest claims points
 * @param {Number} amount - Amount of points to use
 * @param {String} userId - User ID who claims
 * @param {String} type - Transaction type ('claim', 'new_user', 'tourist_quest')
 * @param {String} questId - Quest ID (optional)
 * @param {String} description - Description (optional)
 * @returns {Object} Transaction result
 */
const usePoints = async (amount, userId, type = 'claim', questId = null, description = null) => {
  try {
    const pointSystem = await PointSystem.getSystem();
    
    // Check if enough points available
    if (pointSystem.availablePoints < amount) {
      throw new Error(`Insufficient points available. Available: ${pointSystem.availablePoints}, Required: ${amount}`);
    }

    // Use points
    await pointSystem.usePoints(amount, userId);

    // Create transaction record
    const transaction = await PointTransaction.create({
      type: type,
      amount: amount,
      userId: userId,
      questId: questId,
      description: description || `Points claimed via ${type}`,
      pointSystemState: {
        totalPoints: pointSystem.totalPoints,
        usedPoints: pointSystem.usedPoints,
        availablePoints: pointSystem.availablePoints
      },
      status: 'completed'
    });

    return {
      success: true,
      transaction: transaction,
      pointSystem: pointSystem
    };
  } catch (error) {
    console.error('Error using points:', error);
    throw error;
  }
};

/**
 * Refund points (when user cancels or admin refunds)
 * @param {Number} amount - Amount of points to refund
 * @param {String} userId - User ID (optional)
 * @param {String} transactionId - Original transaction ID (optional)
 * @param {String} description - Description (optional)
 * @returns {Object} Transaction result
 */
const refundPoints = async (amount, userId = null, transactionId = null, description = null) => {
  try {
    const pointSystem = await PointSystem.getSystem();
    
    // Refund points
    await pointSystem.refundPoints(amount, userId);

    // Create transaction record
    const transaction = await PointTransaction.create({
      type: 'refund',
      amount: amount,
      userId: userId,
      description: description || `Points refunded${transactionId ? ` for transaction ${transactionId}` : ''}`,
      pointSystemState: {
        totalPoints: pointSystem.totalPoints,
        usedPoints: pointSystem.usedPoints,
        availablePoints: pointSystem.availablePoints
      },
      status: 'completed'
    });

    // Mark original transaction as refunded if provided
    if (transactionId) {
      await PointTransaction.findByIdAndUpdate(transactionId, {
        status: 'refunded'
      });
    }

    return {
      success: true,
      transaction: transaction,
      pointSystem: pointSystem
    };
  } catch (error) {
    console.error('Error refunding points:', error);
    throw error;
  }
};

/**
 * Get point system status
 * @returns {Object} Point system data
 */
const getPointSystem = async () => {
  try {
    const pointSystem = await PointSystem.getSystem();
    return pointSystem;
  } catch (error) {
    console.error('Error getting point system:', error);
    throw error;
  }
};

/**
 * Check if enough points available
 * @param {Number} amount - Amount to check
 * @returns {Boolean} True if enough points available
 */
const hasEnoughPoints = async (amount) => {
  try {
    const pointSystem = await PointSystem.getSystem();
    return pointSystem.availablePoints >= amount;
  } catch (error) {
    console.error('Error checking points:', error);
    return false;
  }
};

module.exports = {
  usePoints,
  refundPoints,
  getPointSystem,
  hasEnoughPoints
};
