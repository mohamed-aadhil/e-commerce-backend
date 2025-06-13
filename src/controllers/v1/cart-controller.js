const { validationResult } = require('express-validator');
const cartService = require('../../services/v1/cart.service');
const { formatCart, emptyCart } = require('../../dtos/v1/cart.dto');

/**
 * Get the current user's cart
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
const getCart = async (req, res, next) => {
  try {
    const cartId = req.user?.cartId || req.cookies.cartId;
    
    if (!cartId && !req.user?.id) {
      // No cart exists for guest and no user is logged in
      return res.json(emptyCart());
    }

    let cart;
    
    if (req.user?.id) {
      // For authenticated users, get their cart
      cart = await cartService.getOrCreateCart(req.user.id);
    } else if (cartId) {
      // For guests, get their existing cart
      cart = await cartService.getCart(cartId);
    }

    res.json(formatCart(cart));
  } catch (error) {
    next(error);
  }
};

/**
 * Add an item to the cart
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
const addItem = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { productId, quantity = 1 } = req.body;
    const userId = req.user?.id || null;
    const cartId = req.user?.cartId || req.cookies.cartId;
    
    // Use existing cart or create new one
    let cart;
    if (userId) {
      cart = await cartService.getOrCreateCart(userId);
    } else if (cartId) {
      cart = await cartService.getCart(cartId);
    } else {
      cart = await cartService.getOrCreateCart(null);
      // Set cart ID in cookie for guests
      res.cookie('cartId', cart.id, { 
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: true 
      });
    }

    // Add item to cart
    const updatedCart = await cartService.addOrUpdateItem(cart.id, productId, quantity);
    
    res.status(201).json(formatCart(updatedCart));
  } catch (error) {
    next(error);
  }
};

/**
 * Update item quantity in cart
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
const updateItem = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { productId } = req.params;
    const { quantity } = req.body;
    const cartId = req.user?.cartId || req.cookies.cartId;
    
    if (!cartId) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    const updatedCart = await cartService.updateItemQuantity(cartId, productId, quantity);
    res.json(formatCart(updatedCart));
  } catch (error) {
    next(error);
  }
};

/**
 * Remove an item from the cart
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
const removeItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const cartId = req.user?.cartId || req.cookies.cartId;
    
    if (!cartId) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    const updatedCart = await cartService.removeItem(cartId, productId);
    res.json(formatCart(updatedCart));
  } catch (error) {
    next(error);
  }
};

/**
 * Clear all items from the cart
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
const clearCart = async (req, res, next) => {
  try {
    const cartId = req.user?.cartId || req.cookies.cartId;
    
    if (!cartId) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    const updatedCart = await cartService.clearCart(cartId);
    res.json(formatCart(updatedCart));
  } catch (error) {
    next(error);
  }
};

/**
 * Merge guest cart with user cart after login
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
const mergeCarts = async (req, res, next) => {
  try {
    const guestCartId = req.cookies.cartId;
    const userId = req.user.id;

    if (!guestCartId) {
      return res.json({ message: 'No guest cart to merge' });
    }

    const mergedCart = await cartService.mergeCarts(guestCartId, userId);
    
    // Clear the guest cart cookie
    res.clearCookie('cartId');
    
    res.json(formatCart(mergedCart));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
  mergeCarts
};
