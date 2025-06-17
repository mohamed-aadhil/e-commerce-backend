const orderService = require('../../services/v1/order.service');
const { validationResult } = require('express-validator');

/**
 * Create a new order (supports both cart checkout and direct purchase)
 */
const createOrder = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const userId = req.user.id;
    const { addressId, items } = req.body;
    
    const order = await orderService.createOrder(userId, { addressId, items });
    
    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get order details
 */
const getOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const orderId = req.params.id;
    
    const order = await orderService.getOrderById(orderId, userId);
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all orders for current user
 */
const getUserOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    
    const result = await orderService.getUserOrders(userId, { page, limit });
    
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel an order
 */
const cancelOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const orderId = req.params.id;
    
    const order = await orderService.cancelOrder(orderId, userId);
    
    res.json({
      success: true,
      data: order,
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrder,
  getUserOrders,
  cancelOrder
};
