const db = require('../../models');
const { Op } = require('sequelize');

/**
 * Calculate shipping cost based on order details
 * @param {Object} options - Shipping options
 * @param {string} options.shippingMethod - Shipping method (e.g., 'standard', 'express')
 * @param {number} options.itemCount - Number of items in the order
 * @param {number} options.totalWeight - Total weight of the order in grams
 * @returns {Promise<number>} - Calculated shipping cost
 */
const calculateShippingCost = async ({ shippingMethod = 'standard', itemCount = 1, totalWeight = 0 }) => {
  // Simple flat rate shipping calculation
  // In a real application, this would integrate with a shipping API
  const baseCost = 5.99; // Base shipping cost
  let cost = baseCost;

  // Adjust cost based on shipping method
  if (shippingMethod === 'express') {
    cost += 7.99; // Express shipping premium
  } else if (shippingMethod === 'overnight') {
    cost += 14.99; // Overnight shipping premium
  }

  // Add small fee for additional items
  if (itemCount > 1) {
    cost += (itemCount - 1) * 1.5;
  }

  // Add weight-based fee for heavy items (over 1kg)
  if (totalWeight > 1000) {
    const extraWeight = Math.ceil((totalWeight - 1000) / 500); // Charge per 500g over 1kg
    cost += extraWeight * 2.5;
  }

  // Round to 2 decimal places
  return Math.round(cost * 100) / 100;
};

/**
 * Create a shipping record for an order
 * @param {Object} shippingData - Shipping details
 * @param {number} shippingData.orderId - ID of the order
 * @param {number} shippingData.addressId - Shipping address ID
 * @param {string} shippingData.shippingMethod - Shipping method
 * @param {number} shippingData.shippingCost - Calculated shipping cost
 * @param {Object} [transaction] - Optional transaction object
 * @returns {Promise<Object>} - Created shipping record
 */
const createShippingRecord = async (shippingData, transaction = null) => {
  const { orderId, addressId, shippingMethod, shippingCost } = shippingData;

  const shipping = await db.Shipping.create(
    {
      order_id: orderId,
      address_id: addressId,
      shipping_method: shippingMethod,
      shipping_status: 'pending',
      shipping_cost: shippingCost,
    },
    { transaction }
  );

  return shipping;
};

/**
 * Update shipping status
 * @param {number} shippingId - ID of the shipping record
 * @param {string} status - New status ('pending', 'shipped', 'delivered', 'cancelled')
 * @param {Object} [updateData] - Additional update data (e.g., tracking_number, shipped_at)
 * @param {Object} [transaction] - Optional transaction object
 * @returns {Promise<Array<number>>} - Number of affected rows
 */
const updateShippingStatus = async (shippingId, status, updateData = {}, transaction = null) => {
  const validStatuses = ['pending', 'shipped', 'delivered', 'cancelled'];
  
  if (!validStatuses.includes(status)) {
    const error = new Error('Invalid shipping status');
    error.status = 400;
    throw error;
  }

  const updateFields = {
    shipping_status: status,
    ...updateData
  };

  // Set shipped_at timestamp if status is 'shipped' and not already set
  if (status === 'shipped' && !updateData.shipped_at) {
    updateFields.shipped_at = new Date();
  }

  // Set delivered_at timestamp if status is 'delivered' and not already set
  if (status === 'delivered' && !updateData.delivered_at) {
    updateFields.delivered_at = new Date();
  }

  const [affectedCount] = await db.Shipping.update(
    updateFields,
    {
      where: { id: shippingId },
      transaction
    }
  );

  return affectedCount;
};

/**
 * Get shipping details by order ID
 * @param {number} orderId - ID of the order
 * @param {Object} [transaction] - Optional transaction object
 * @returns {Promise<Object|null>} - Shipping details or null if not found
 */
const getShippingByOrderId = async (orderId, transaction = null) => {
  const shipping = await db.Shipping.findOne({
    where: { order_id: orderId },
    include: [
      {
        model: db.Address,
        as: 'address',
        attributes: { exclude: ['created_at', 'updated_at'] }
      }
    ],
    transaction
  });

  return shipping;
};

module.exports = {
  calculateShippingCost,
  createShippingRecord,
  updateShippingStatus,
  getShippingByOrderId
};
