const express = require('express');
const router = express.Router();
const cartController = require('../../controllers/v1/cart.controller');
const { cartValidation } = require('../../dtos/v1/cart.dto');
const { validateRequest } = require('../../middlewares/validation.middleware');
const jwt = require('jsonwebtoken');
const db = require('../../models');
const { User } = db;

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const secret = process.env.JWT_SECRET;
    const decoded = jwt.verify(token, secret);
    
    // Attach user to request if token is valid
    User.findByPk(decoded.id)
      .then(user => {
        if (user) {
          req.user = user;
        }
        next();
      })
      .catch(next);
  } catch (err) {
    // If token is invalid, just continue without user
    next();
  }
};

// Apply optional authentication middleware
router.use(optionalAuth);

// Get current cart
router.get('/', cartController.getCart);

// Add item to cart
router.post('/items', cartValidation.addItem, validateRequest, cartController.addItem);

// Update item quantity in cart
router.put('/items/:productId', cartValidation.updateItem, validateRequest, cartController.updateItem);

// Remove item from cart
router.delete('/items/:productId', cartController.removeItem);

// Clear all items from cart
router.delete('/', cartController.clearCart);

// Merge guest cart with user cart after login
router.post('/merge', (req, res, next) => {
  if (!req.user) {
    const error = new Error('User not authenticated');
    error.status = 401;
    return next(error);
  }
  next();
}, cartController.mergeCarts);

// Checkout cart and create order
router.post(
  '/checkout',
  (req, res, next) => {
    if (!req.user) {
      const error = new Error('Authentication required for checkout');
      error.status = 401;
      return next(error);
    }
    next();
  },
  cartValidation.checkout,
  validateRequest,
  cartController.checkout
);

module.exports = router;
