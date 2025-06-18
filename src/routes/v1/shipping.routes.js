const express = require('express');
const { body, param, query } = require('express-validator');
const shippingController = require('../../controllers/v1/shipping.controller');
const { authenticate, authorize } = require('../../middlewares/auth');
const { validateRequest } = require('../../middlewares/validation.middleware');

const router = express.Router();

// Public routes (no authentication required)
router.get(
  '/methods',
  shippingController.getShippingMethods
);

// Protected routes (require authentication)
router.use(authenticate);

// Calculate shipping cost (authenticated)
router.post(
  '/calculate',
  [
    body('shippingMethod')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Shipping method is required'),
    body('itemCount')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Item count must be a positive integer'),
    body('totalWeight')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Total weight must be a positive number'),
    validateRequest
  ],
  shippingController.calculateShipping
);

// Get shipping details for an order
router.get(
  '/orders/:orderId',
  [
    param('orderId')
      .isInt({ min: 1 })
      .withMessage('Valid order ID is required'),
    validateRequest
  ],
  shippingController.getOrderShipping
);

// Admin routes (require admin role)
router.use(authorize('admin'));

// Update shipping status (admin only)
router.put(
  '/:id/status',
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Valid shipping ID is required'),
    body('status')
      .isString()
      .trim()
      .isIn(['pending', 'shipped', 'delivered', 'cancelled'])
      .withMessage('Invalid shipping status'),
    body('trackingNumber')
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Tracking number cannot be empty if provided'),
    validateRequest
  ],
  shippingController.updateShippingStatus
);

module.exports = router;
