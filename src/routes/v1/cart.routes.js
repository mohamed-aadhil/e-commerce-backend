const express = require('express');
const { body, param } = require('express-validator');
const {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
  mergeCarts
} = require('../../controllers/v1/cart-controller');
const { validateRequest } = require('../../middlewares/validation.middleware');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = express.Router();

// Apply authentication middleware to all routes except GET /cart
// The authenticate middleware will still allow unauthenticated requests but will attach user if available
router.use(authenticate({ required: false }));

// GET /api/v1/cart - Get current cart (creates one if doesn't exist)
router.get('/', getCart);

// POST /api/v1/cart/items - Add item to cart
router.post(
  '/items',
  [
    body('productId').isInt({ min: 1 }).withMessage('Valid product ID is required'),
    body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  ],
  validateRequest,
  addItem
);

// PUT /api/v1/cart/items/:productId - Update item quantity in cart
router.put(
  '/items/:productId',
  [
    param('productId').isInt({ min: 1 }).withMessage('Valid product ID is required'),
    body('quantity').isInt({ min: 0 }).withMessage('Valid quantity is required'),
  ],
  validateRequest,
  updateItem
);

// DELETE /api/v1/cart/items/:productId - Remove item from cart
router.delete(
  '/items/:productId',
  [
    param('productId').isInt({ min: 1 }).withMessage('Valid product ID is required'),
  ],
  validateRequest,
  removeItem
);

// DELETE /api/v1/cart - Clear all items from cart
router.delete('/', clearCart);

// POST /api/v1/cart/merge - Merge guest cart with user cart (after login)
router.post(
  '/merge',
  authenticate({ required: true }), // This one requires authentication
  mergeCarts
);

module.exports = router;
