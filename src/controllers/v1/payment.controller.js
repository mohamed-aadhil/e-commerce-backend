const paymentService = require('../../services/v1/payment.service');
const { validationResult } = require('express-validator');

/**
 * Create and process a payment
 */
const createPayment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { orderId, amount, paymentMethod = 'mock_gateway' } = req.body;
    const userId = req.user.id;

    // Verify the order belongs to the user
    const order = await db.Order.findOne({
      where: { id: orderId, user_id: userId },
      include: [{
        model: db.Payment,
        where: { payment_status: { [Op.notIn]: ['completed', 'refunded'] } },
        required: false
      }]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or already paid'
      });
    }

    // Create payment record
    const payment = await paymentService.createPayment(
      orderId,
      amount,
      paymentMethod
    );

    // Process payment (async)
    paymentService.processPayment(payment.id, {})
      .catch(console.error); // Log any errors but don't fail the request

    res.status(201).json({
      success: true,
      data: {
        paymentId: payment.id,
        orderId: payment.order_id,
        amount: payment.amount,
        status: payment.payment_status,
        paymentMethod: payment.payment_method
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get payment status
 */
const getPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const payment = await paymentService.getPayment(id);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Verify the payment's order belongs to the user
    if (payment.Order.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this payment'
      });
    }

    res.json({
      success: true,
      data: {
        id: payment.id,
        orderId: payment.order_id,
        amount: payment.amount,
        status: payment.payment_status,
        transactionId: payment.transaction_id,
        paymentMethod: payment.payment_method,
        paidAt: payment.paid_at,
        orderStatus: payment.Order.status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Confirm payment (for testing)
 */
const confirmPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { success = true } = req.body;
    const userId = req.user.id;

    // Get payment with order
    const payment = await db.Payment.findByPk(id, {
      include: [{
        model: db.Order,
        attributes: ['id', 'user_id']
      }]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Verify the payment's order belongs to the user
    if (payment.Order.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this payment'
      });
    }

    // Process payment with the specified success status
    const result = await paymentService.processPayment(payment.id, { success });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Process a refund
 */
const refundPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason = '' } = req.body;
    const userId = req.user.id;

    // Get payment with order
    const payment = await db.Payment.findByPk(id, {
      include: [{
        model: db.Order,
        attributes: ['id', 'user_id']
      }]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Verify the payment's order belongs to the user
    if (payment.Order.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this payment'
      });
    }

    // Process refund
    const result = await paymentService.processRefund(payment.id, reason);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPayment,
  getPayment,
  confirmPayment,
  refundPayment
};
