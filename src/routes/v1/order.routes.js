const express = require('express');
const { body, param, query, check } = require('express-validator');
const orderController = require('../../controllers/v1/order.controller');
const { authenticate } = require('../../middlewares/auth');
const { validateRequest } = require('../../middlewares/validation.middleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Create a new order (supports both cart checkout and direct purchase)
router.post(
  '/',
  [
    body('addressId').isInt().withMessage('Valid address ID is required'),
    body('shippingMethod')
      .optional()
      .isString()
      .trim()
      .isIn(['standard', 'express', 'overnight'])
      .withMessage('Invalid shipping method. Must be one of: standard, express, overnight'),
    body('paymentMethod')
      .optional()
      .isString()
      .trim()
      .isIn(['credit_card', 'debit_card', 'paypal', 'wallet'])
      .withMessage('Invalid payment method. Must be one of: credit_card, debit_card, paypal, wallet'),
    body('items')
      .optional()
      .isArray()
      .withMessage('Items must be an array')
      .custom(items => {
        if (items && items.length === 0) {
          throw new Error('Items array cannot be empty');
        }
        return true;
      }),
    body('items.*.productId')
      .if(body('items').exists())
      .isInt({ min: 1 })
      .withMessage('Valid product ID is required'),
    body('items.*.quantity')
      .if(body('items').exists())
      .isInt({ min: 1 })
      .withMessage('Quantity must be at least 1'),
    validateRequest
  ],
  orderController.createOrder
);

// Get all orders for current user
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    validateRequest
  ],
  orderController.getUserOrders
);

// Get order details by ID
router.get(
  '/:id',
  [
    param('id').isInt().withMessage('Valid order ID is required'),
    validateRequest
  ],
  orderController.getOrder
);

// Cancel an order
router.post(
  '/:id/cancel',
  [
    param('id').isInt().withMessage('Valid order ID is required'),
    validateRequest
  ],
  orderController.cancelOrder
);

module.exports = router;
