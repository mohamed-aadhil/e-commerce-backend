const db = require('../../models');
const { Op } = require('sequelize');

/**
 * Create a payment record
 */
const createPayment = async (orderId, amount, paymentMethod = 'mock_gateway') => {
  const payment = await db.Payment.create({
    order_id: orderId,
    payment_method: paymentMethod,
    payment_status: 'pending',
    amount: amount
  });

  return payment;
};

/**
 * Process a mock payment
 * @param {number} paymentId - The payment ID
 * @param {object} paymentDetails - Payment details
 * @returns {Promise<object>} - Payment result
 */
const processPayment = async (paymentId, paymentDetails = {}) => {
  const t = await db.sequelize.transaction();
  
  try {
    const payment = await db.Payment.findByPk(paymentId, { transaction: t });
    if (!payment) {
      throw new Error('Payment not found');
    }

    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Randomly succeed or fail (80% success rate)
    const isSuccess = Math.random() < 0.8;
    const transactionId = `txn_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // Update payment status
    payment.payment_status = isSuccess ? 'completed' : 'failed';
    payment.transaction_id = isSuccess ? transactionId : null;
    payment.paid_at = isSuccess ? new Date() : null;
    
    await payment.save({ transaction: t });

    // Update order status
    if (isSuccess) {
      await db.Order.update(
        { status: 'paid' },
        { where: { id: payment.order_id }, transaction: t }
      );
    }

    await t.commit();

    return {
      success: isSuccess,
      paymentId: payment.id,
      orderId: payment.order_id,
      status: payment.payment_status,
      transactionId: payment.transaction_id,
      amount: payment.amount,
      paidAt: payment.paid_at
    };
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

/**
 * Get payment by ID
 */
const getPayment = async (paymentId) => {
  return await db.Payment.findByPk(paymentId, {
    include: [{
      model: db.Order,
      attributes: ['id', 'status', 'total']
    }]
  });
};

/**
 * Process a refund
 */
const processRefund = async (paymentId, reason = '') => {
  const t = await db.sequelize.transaction();
  
  try {
    const payment = await db.Payment.findByPk(paymentId, { transaction: t });
    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.payment_status !== 'completed') {
      throw new Error('Only completed payments can be refunded');
    }

    // Update payment status to refunded
    payment.payment_status = 'refunded';
    payment.refunded_at = new Date();
    await payment.save({ transaction: t });

    // Update order status to refunded
    await db.Order.update(
      { status: 'refunded' },
      { where: { id: payment.order_id }, transaction: t }
    );

    await t.commit();

    return {
      success: true,
      paymentId: payment.id,
      orderId: payment.order_id,
      status: 'refunded',
      amount: payment.amount,
      refundedAt: payment.refunded_at
    };
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

module.exports = {
  createPayment,
  processPayment,
  getPayment,
  processRefund
};
