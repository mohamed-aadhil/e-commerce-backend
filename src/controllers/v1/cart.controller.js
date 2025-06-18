const cartService = require('../../services/v1/cart.service');
const { cartResponseDTO, cartValidation } = require('../../dtos/v1/cart.dto');
const db = require('../../models');
const { Product } = db;
const { validationResult } = require('express-validator');

/**
 * Get the current user's cart
 * Creates a new cart if one doesn't exist
 */
const getCart = async (req, res, next) => {
  try {
    const cart = await cartService.getOrCreateCart(req.sessionID, req.user?.id);
    res.json({
      success: true,
      data: cartResponseDTO(cart)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add an item to the cart or update quantity if it exists
 */
const addItem = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    
    if (!productId || quantity === undefined) {
      const error = new Error('Product ID and quantity are required');
      error.status = 400;
      throw error;
    }
    
    if (quantity <= 0) {
      const error = new Error('Quantity must be greater than 0');
      error.status = 400;
      throw error;
    }

    const cart = await cartService.addItem(
      req.sessionID,
      productId,
      quantity,
      req.user?.id
    );

    res.status(201).json({
      success: true,
      message: 'Item added to cart',
      data: cartResponseDTO(cart)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove an item from the cart
 */
const updateItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    
    if (!productId || quantity === undefined) {
      const error = new Error('Product ID and quantity are required');
      error.status = 400;
      throw error;
    }
    
    if (quantity <= 0) {
      return removeItem(req, res, next);
    }

    const cart = await cartService.updateItem(
      req.sessionID,
      productId,
      quantity,
      req.user?.id
    );

    res.json({
      success: true,
      message: 'Item updated in cart',
      data: cartResponseDTO(cart)
    });
  } catch (error) {
    next(error);
  }
};

const removeItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    
    if (!productId) {
      const error = new Error('Product ID is required');
      error.status = 400;
      throw error;
    }

    const cart = await cartService.removeItem(
      req.sessionID,
      productId,
      req.user?.id
    );

    res.json({
      success: true,
      message: 'Item removed from cart',
      data: cartResponseDTO(cart)
    });
  } catch (error) {
    next(error);
  }
};

const clearCart = async (req, res, next) => {
  try {
    const cart = await cartService.clearCart(
      req.sessionID,
      req.user?.id
    );

    res.json({
      success: true,
      message: 'Cart cleared',
      data: cartResponseDTO(cart)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Merge guest cart with user cart after login
 */
const mergeCarts = async (req, res, next) => {
  try {
    if (!req.user) {
      const error = new Error('User not authenticated');
      error.status = 401;
      throw error;
    }

    const cart = await cartService.mergeCarts(req.sessionID, req.user.id);
    res.json({
      success: true,
      data: cartResponseDTO(cart)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Checkout the cart and create an order
 */
const checkout = async (req, res, next) => {
  const t = await db.sequelize.transaction();
  
  try {
    // Check if user is authenticated
    if (!req.user) {
      const error = new Error('Authentication required for checkout');
      error.status = 401;
      throw error;
    }

    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { addressId, shippingMethod, paymentMethod } = req.body;

    // Process checkout
    const order = await cartService.checkout(
      req.sessionID,
      req.user.id,
      {
        addressId,
        shippingMethod: shippingMethod || 'standard',
        paymentMethod: paymentMethod || 'credit_card'
      },
      { transaction: t }
    );

    await t.commit();
    
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        orderId: order.id,
        status: order.status,
        total: order.total,
        items: order.items
      }
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

module.exports = {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
  mergeCarts,
  checkout
};
