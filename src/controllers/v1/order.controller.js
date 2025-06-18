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
    const { 
      addressId, 
      items, 
      shippingMethod = 'standard',
      paymentMethod = 'credit_card'
    } = req.body;
    
    // Validate shipping method
    const validShippingMethods = ['standard', 'express', 'overnight'];
    if (!validShippingMethods.includes(shippingMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid shipping method',
        validMethods: validShippingMethods
      });
    }
    
    // Validate payment method
    const validPaymentMethods = ['credit_card', 'debit_card', 'paypal', 'wallet'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method',
        validMethods: validPaymentMethods
      });
    }
    
    // Create the order with shipping and initial payment record
    const order = await orderService.createOrder(userId, { 
      addressId, 
      items, 
      shippingMethod,
      paymentMethod
    });
    
    // In a real application, you would:
    // 1. Redirect to payment gateway if needed
    // 2. Or process payment asynchronously
    // 3. Or return payment instructions
    
    const response = {
      ...order,
      payment: {
        status: 'pending',
        next_steps: [
          {
            action: 'process_payment',
            method: 'POST',
            url: `/api/v1/payments/${order.payment_id}/process`,
            description: 'Process the payment for this order'
          },
          {
            action: 'check_status',
            method: 'GET',
            url: `/api/v1/orders/${order.id}`,
            description: 'Check the status of this order'
          }
        ]
      }
    };
    
    res.status(201).json({
      success: true,
      data: response,
      message: 'Order created successfully. Please proceed with payment.'
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
