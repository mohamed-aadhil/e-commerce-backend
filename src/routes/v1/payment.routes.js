const express = require('express');
const { body, param } = require('express-validator');
const paymentController = require('../../controllers/v1/payment.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   POST /api/v1/payments
 * @desc    Create and process a payment
 * @access  Private
 */
router.post(
  '/',
  [
    body('orderId', 'Order ID is required').isInt(),
    body('amount', 'Amount must be a positive number').isFloat({ min: 0.01 }),
    body('paymentMethod', 'Invalid payment method').optional().isString(),
    validate
  ],
  paymentController.createPayment
);

/**
 * @route   GET /api/v1/payments/:id
 * @desc    Get payment status
 * @access  Private
 */
router.get(
  '/:id',
  [
    param('id', 'Valid payment ID is required').isInt(),
    validate
  ],
  paymentController.getPayment
);

/**
 * @route   POST /api/v1/payments/:id/confirm
 * @desc    Confirm a payment (for testing)
 * @access  Private
 */
router.post(
  '/:id/confirm',
  [
    param('id', 'Valid payment ID is required').isInt(),
    body('success', 'Success must be a boolean').optional().isBoolean(),
    validate
  ],
  paymentController.confirmPayment
);

/**
 * @route   POST /api/v1/payments/:id/refund
 * @desc    Process a refund
 * @access  Private
 */
router.post(
  '/:id/refund',
  [
    param('id', 'Valid payment ID is required').isInt(),
    body('reason', 'Reason must be a string').optional().isString(),
    validate
  ],
  paymentController.refundPayment
);

module.exports = router;
