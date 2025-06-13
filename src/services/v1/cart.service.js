const { Op } = require('sequelize');
const { Cart, CartItem, Product, Inventory } = require('../../models');
const { formatCart } = require('../../dtos/v1/cart.dto');

/**
 * Get or create a cart for a user
 * @param {number|null} userId - User ID or null for guest
 * @returns {Promise<Object>} Cart object with items
 */
const getOrCreateCart = async (userId) => {
  try {
    let cart;
    
    if (userId) {
      // For logged-in users, find or create their cart
      [cart] = await Cart.findOrCreate({
        where: { user_id: userId },
        include: [{
          model: CartItem,
          include: [Product]
        }],
        defaults: { user_id: userId }
      });
    } else {
      // For guests, create a new cart without a user ID
      cart = await Cart.create({}, {
        include: [CartItem]
      });
    }

    // Ensure we have the latest items
    const cartWithItems = await Cart.findByPk(cart.id, {
      include: [{
        model: CartItem,
        include: [Product]
      }]
    });

    return formatCart(cartWithItems);
  } catch (error) {
    console.error('Error in getOrCreateCart:', error);
    throw new Error('Failed to get or create cart');
  }
};

/**
 * Get cart with items
 * @param {number} cartId - Cart ID
 * @returns {Promise<Object>} Cart with items
 */
const getCart = async (cartId) => {
  try {
    const cart = await Cart.findByPk(cartId, {
      include: [{
        model: CartItem,
        include: [{
          model: Product,
          include: [Inventory]
        }]
      }]
    });

    if (!cart) {
      throw new Error('Cart not found');
    }

    return formatCart(cart);
  } catch (error) {
    console.error('Error in getCart:', error);
    throw error;
  }
};

/**
 * Add an item to the cart or update quantity if it exists
 * @param {number} cartId - Cart ID
 * @param {number} productId - Product ID to add
 * @param {number} quantity - Quantity to add
 * @returns {Promise<Object>} Updated cart
 */
const addOrUpdateItem = async (cartId, productId, quantity) => {
  const transaction = await Cart.sequelize.transaction();
  
  try {
    // Check if product exists and is in stock
    const product = await Product.findByPk(productId, {
      include: [Inventory]
    });

    if (!product) {
      throw new Error('Product not found');
    }

    // Check inventory
    const inventory = product.Inventory;
    if (!inventory || inventory.quantity < quantity) {
      throw new Error('Insufficient stock');
    }

    // Find or create cart item
    const [cartItem, created] = await CartItem.findOrCreate({
      where: { 
        cart_id: cartId,
        product_id: productId
      },
      defaults: { quantity: 0 },
      transaction
    });

    // Update quantity
    const newQuantity = created ? quantity : cartItem.quantity + quantity;
    await cartItem.update({ quantity: newQuantity }, { transaction });

    await transaction.commit();

    // Return updated cart
    return getCart(cartId);
  } catch (error) {
    await transaction.rollback();
    console.error('Error in addOrUpdateItem:', error);
    throw error;
  }
};

/**
 * Update item quantity in cart
 * @param {number} cartId - Cart ID
 * @param {number} productId - Product ID to update
 * @param {number} quantity - New quantity
 * @returns {Promise<Object>} Updated cart
 */
const updateItemQuantity = async (cartId, productId, quantity) => {
  const transaction = await Cart.sequelize.transaction();
  
  try {
    if (quantity <= 0) {
      return removeItem(cartId, productId);
    }

    // Check inventory
    const product = await Product.findByPk(productId, {
      include: [Inventory]
    });

    if (!product) {
      throw new Error('Product not found');
    }

    if (product.Inventory.quantity < quantity) {
      throw new Error('Insufficient stock');
    }

    // Update cart item
    const [updated] = await CartItem.update(
      { quantity },
      { 
        where: { 
          cart_id: cartId, 
          product_id: productId 
        },
        transaction
      }
    );

    if (updated === 0) {
      throw new Error('Item not found in cart');
    }

    await transaction.commit();
    return getCart(cartId);
  } catch (error) {
    await transaction.rollback();
    console.error('Error in updateItemQuantity:', error);
    throw error;
  }
};

/**
 * Remove an item from the cart
 * @param {number} cartId - Cart ID
 * @param {number} productId - Product ID to remove
 * @returns {Promise<Object>} Updated cart
 */
const removeItem = async (cartId, productId) => {
  try {
    await CartItem.destroy({
      where: {
        cart_id: cartId,
        product_id: productId
      }
    });

    return getCart(cartId);
  } catch (error) {
    console.error('Error in removeItem:', error);
    throw new Error('Failed to remove item from cart');
  }
};

/**
 * Clear all items from the cart
 * @param {number} cartId - Cart ID
 * @returns {Promise<Object>} Empty cart
 */
const clearCart = async (cartId) => {
  try {
    await CartItem.destroy({
      where: { cart_id: cartId }
    });

    return getCart(cartId);
  } catch (error) {
    console.error('Error in clearCart:', error);
    throw new Error('Failed to clear cart');
  }
};

/**
 * Merge guest cart with user cart on login
 * @param {number} guestCartId - Guest cart ID
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Merged cart
 */
const mergeCarts = async (guestCartId, userId) => {
  const transaction = await Cart.sequelize.transaction();
  
  try {
    // Get or create user cart
    const [userCart] = await Cart.findOrCreate({
      where: { user_id: userId },
      transaction
    });

    // Get guest cart items
    const guestCartItems = await CartItem.findAll({
      where: { cart_id: guestCartId },
      transaction
    });

    // Move items to user cart
    for (const item of guestCartItems) {
      const [existingItem] = await CartItem.findOrCreate({
        where: {
          cart_id: userCart.id,
          product_id: item.product_id
        },
        defaults: {
          quantity: 0
        },
        transaction
      });

      // Update quantity
      await existingItem.update({
        quantity: existingItem.quantity + item.quantity
      }, { transaction });
    }

    
    // Delete guest cart
    await Cart.destroy({
      where: { id: guestCartId },
      transaction
    });

    await transaction.commit();
    return getCart(userCart.id);
  } catch (error) {
    await transaction.rollback();
    console.error('Error in mergeCarts:', error);
    throw new Error('Failed to merge carts');
  }
};

module.exports = {
  getOrCreateCart,
  getCart,
  addOrUpdateItem,
  updateItemQuantity,
  removeItem,
  clearCart,
  mergeCarts
};
