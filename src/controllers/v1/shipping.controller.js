const shippingService = require('../../services/v1/shipping.service');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

// Available shipping methods with their display names and descriptions
const SHIPPING_METHODS = [
  {
    id: 'standard',
    name: 'Standard Shipping',
    description: '3-5 business days',
    minDays: 3,
    maxDays: 5,
  },
  {
    id: 'express',
    name: 'Express Shipping',
    description: '1-2 business days',
    minDays: 1,
    maxDays: 2,
  },
  {
    id: 'overnight',
    name: 'Overnight Shipping',
    description: 'Next business day',
    minDays: 1,
    maxDays: 1,
  },
];

/**
 * Get available shipping methods
 */
const getShippingMethods = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: SHIPPING_METHODS,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate shipping cost
 */
const calculateShipping = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { shippingMethod, itemCount, totalWeight } = req.body;
    
    // Validate shipping method
    const validMethod = SHIPPING_METHODS.some(method => method.id === shippingMethod);
    if (!validMethod) {
      return res.status(400).json({
        success: false,
        message: 'Invalid shipping method',
      });
    }

    const cost = await shippingService.calculateShippingCost({
      shippingMethod,
      itemCount: parseInt(itemCount, 10) || 1,
      totalWeight: parseFloat(totalWeight) || 0,
    });

    // Get method details
    const method = SHIPPING_METHODS.find(m => m.id === shippingMethod);

    res.json({
      success: true,
      data: {
        shippingMethod,
        cost,
        estimatedDelivery: {
          minDays: method.minDays,
          maxDays: method.maxDays,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get shipping details for an order
 */
const getOrderShipping = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    
    // First verify the order belongs to the user (or user is admin)
    const order = await req.db.Order.findOne({
      where: { 
        id: orderId,
        [Op.or]: [
          { user_id: userId },
          { '$order.user_id$': userId } // In case it's included
        ]
      },
      include: [
        {
          model: req.db.User,
          as: 'user',
          attributes: ['id'],
        },
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or access denied',
      });
    }

    const shipping = await shippingService.getShippingByOrderId(orderId);

    if (!shipping) {
      return res.status(404).json({
        success: false,
        message: 'Shipping information not found for this order',
      });
    }

    res.json({
      success: true,
      data: shipping,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update shipping status (Admin only)
 */
const updateShippingStatus = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { id } = req.params;
    const { status, trackingNumber } = req.body;

    // Verify the shipping record exists
    const shipping = await req.db.Shipping.findByPk(id, {
      include: [
        {
          model: req.db.Order,
          as: 'order',
          include: [
            {
              model: req.db.User,
              as: 'user',
              attributes: ['id', 'email', 'name'],
            },
          ],
        },
      ],
    });

    if (!shipping) {
      return res.status(404).json({
        success: false,
        message: 'Shipping record not found',
      });
    }

    const updateData = {};
    if (trackingNumber) {
      updateData.tracking_number = trackingNumber;
    }

    await shippingService.updateShippingStatus(id, status, updateData);

    // In a real application, you might want to:
    // 1. Send email notification to the user
    // 2. Update order status if needed
    // 3. Log the status change

    // Get updated shipping record
    const updatedShipping = await shippingService.getShippingByOrderId(shipping.order_id);

    res.json({
      success: true,
      data: updatedShipping,
      message: 'Shipping status updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getShippingMethods,
  calculateShipping,
  getOrderShipping,
  updateShippingStatus,
};
