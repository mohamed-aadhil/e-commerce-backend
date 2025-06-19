const db = require('../../models');
const { Op } = require('sequelize');
const cartService = require('./cart.service');

/**
 * Create a payment record
 * @param {number} orderId - The order ID
 * @param {number} amount - The payment amount
 * @param {string} paymentMethod - The payment method (default: 'credit_card')
 * @param {object} transaction - Optional Sequelize transaction
 * @returns {Promise<object>} - The created payment record
 */
const createPayment = async (orderId, amount, paymentMethod = 'credit_card', transaction = null) => {
  const options = {};
  if (transaction) {
    options.transaction = transaction;
  }

  const payment = await db.Payment.create({
    order_id: orderId,
    payment_method: paymentMethod,
    payment_status: 'pending',
    amount: amount,
    transaction_id: null,
    paid_at: null,
    refunded_at: null
  }, options);

  return payment.get({ plain: true });
};

/**
 * Process a payment asynchronously
 * @param {number} paymentId - The payment ID
 * @param {object} paymentDetails - Payment details (e.g., card info, billing address)
 * @param {object} options - Additional options
 * @param {number} [options.retryCount=0] - Current retry attempt
 * @param {number} [options.maxRetries=3] - Maximum number of retry attempts
 * @returns {Promise<object>} - Payment result
 */
const processPayment = async (paymentId, paymentDetails = {}, options = {}) => {
  const { retryCount = 0, maxRetries = 3 } = options;
  const t = await db.sequelize.transaction();
  
  try {
    // 1. Fetch payment with related order and shipping info
    const payment = await db.Payment.findByPk(paymentId, {
      include: [
        {
          model: db.Order,
          as: 'order',
          include: [
            {
              model: db.Shipping,
              as: 'shipping'
            },
            {
              model: db.Cart,
              as: 'cart',
              attributes: ['id']
            }
          ]
        }
      ],
      transaction: t
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    // 2. Validate payment status
    if (payment.payment_status === 'completed') {
      await t.rollback();
      return {
        success: true,
        paymentId: payment.id,
        orderId: payment.order_id,
        status: 'completed',
        message: 'Payment already processed successfully'
      };
    }

    if (payment.payment_status === 'failed' && retryCount >= maxRetries) {
      await t.rollback();
      throw new Error(`Payment failed after ${maxRetries} attempts`);
    }

    // 3. Update payment status to processing
    payment.payment_status = 'processing';
    payment.updated_at = new Date();
    await payment.save({ transaction: t });

    // 4. Update order status
    await db.Order.update(
      { 
        status: 'processing_payment',
        updated_at: new Date() 
      },
      { 
        where: { id: payment.order_id },
        transaction: t 
      }
    );

    await t.commit();

    // 5. Process payment (simulated with 2s delay)
    try {
      // In a real implementation, this would be an API call to a payment gateway
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate payment success/failure (80% success rate)
      const isSuccess = Math.random() < 0.8;
      
      if (!isSuccess) {
        throw new Error('Payment declined by bank');
      }
      
      // 6. If successful, update payment and order status
      const transactionId = `txn_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const updateTxn = await db.sequelize.transaction();
      
      try {
        // Update payment
        payment.payment_status = 'completed';
        payment.transaction_id = transactionId;
        payment.paid_at = new Date();
        payment.updated_at = new Date();
        await payment.save({ transaction: updateTxn });

        // Update order status
        await db.Order.update(
          { 
            status: 'processing',
            payment_status: 'completed',
            updated_at: new Date() 
          },
          { 
            where: { id: payment.order_id },
            transaction: updateTxn 
          }
        );

        // Update shipping status
        if (payment.order?.shipping) {
          await db.Shipping.update(
            { 
              shipping_status: 'preparing',
              updated_at: new Date() 
            },
            { 
              where: { order_id: payment.order_id },
              transaction: updateTxn 
            }
          );
        }

        await updateTxn.commit();

        // 7. Clear the cart after successful payment if it was a cart checkout
        if (payment.order?.cart_id) {
          try {
            await cartService.clearCartById(payment.order.cart_id, { transaction: updateTxn });
            console.log(`[PAYMENT] Cart ${payment.order.cart_id} cleared after successful payment for order ${payment.order_id}`);
          } catch (cartError) {
            // Log the error but don't fail the payment
            console.error(`[PAYMENT] Error clearing cart ${payment.order.cart_id}:`, cartError);
          }
        }

        // In a real application, you might also want to:
        // 1. Send order confirmation email
        // 2. Trigger any post-payment workflows

        return {
          success: true,
          paymentId: payment.id,
          orderId: payment.order_id,
          status: 'completed',
          transactionId,
          amount: payment.amount,
          paidAt: payment.paid_at
        };

      } catch (updateError) {
        await updateTxn.rollback();
        throw updateError;
      }

    } catch (processError) {
      // 7. Handle payment processing failure
      const retryTxn = await db.sequelize.transaction();
      
      try {
        // Update payment status
        payment.payment_status = retryCount < maxRetries ? 'pending' : 'failed';
        payment.updated_at = new Date();
        await payment.save({ transaction: retryTxn });

        // Update order status
        await db.Order.update(
          { 
            status: retryCount < maxRetries ? 'pending_payment' : 'payment_failed',
            payment_status: retryCount < maxRetries ? 'pending' : 'failed',
            updated_at: new Date() 
          },
          { 
            where: { id: payment.order_id },
            transaction: retryTxn 
          }
        );

        await retryTxn.commit();

        // 8. Retry if we haven't exceeded max retries
        if (retryCount < maxRetries) {
          console.log(`Retrying payment ${paymentId}, attempt ${retryCount + 1} of ${maxRetries}`);
          return processPayment(
            paymentId, 
            paymentDetails, 
            { ...options, retryCount: retryCount + 1 }
          );
        }

        throw new Error(`Payment processing failed: ${processError.message}`);

      } catch (retryError) {
        await retryTxn.rollback();
        throw retryError;
      }
    }

  } catch (error) {
    await t.rollback();
    console.error('Payment processing error:', error);
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
