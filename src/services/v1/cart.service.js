const { Op } = require('sequelize');
const db = require('../../models');
const { Cart, CartItem, Product, Inventory } = db;

// Common include options for cart queries
const cartIncludeOptions = [
  {
    model: CartItem,
    as: 'items',
    include: [
      {
        model: Product,
        as: 'product',
        attributes: ['id', 'title', 'selling_price', 'images'],
        include: [
          {
            model: Inventory,
            as: 'inventory',
            attributes: ['quantity']
          }
        ]
      }
    ]
  }
];

/**
 * Get or create a cart for a user or guest
 * @param {string} sessionId - Session ID (required for both guests and users)
 * @param {number} [userId] - User ID if authenticated
 * @returns {Promise<Cart>} The cart object
 */
async function getOrCreateCart(sessionId, userId = null, options = {}) {
  const { transaction } = options;
  console.log(`[CART SERVICE] getOrCreateCart - Session: ${sessionId}, User: ${userId}`);
  
  // Log the current time to help track the request
  console.log(`[CART SERVICE] getOrCreateCart request time: ${new Date().toISOString()}`);
  
  const findOrCreateCart = async (t) => {
    try {
      // Try to find existing cart
      const whereClause = userId 
        ? { user_id: userId, is_guest: false }
        : { session_id: sessionId, is_guest: true };
      
      console.log(`[CART SERVICE] Looking for cart with:`, JSON.stringify(whereClause, null, 2));
      
      let cart = await Cart.findOne({
        where: whereClause,
        include: [
          {
            model: CartItem,
            as: 'items',
            include: [{
              model: db.Product,
              as: 'product',
              include: [{
                model: db.Inventory,
                as: 'inventory',
                required: false
              }]
            }]
          }
        ],
        transaction: t
      });
      
      console.log(`[CART SERVICE] Found cart: ${cart ? 'Yes' : 'No'}`);
      if (cart) {
        console.log(`[CART SERVICE] Cart details:`, {
          id: cart.id,
          userId: cart.user_id,
          sessionId: cart.session_id,
          isGuest: cart.is_guest,
          itemCount: cart.items?.length || 0,
          createdAt: cart.createdAt,
          updatedAt: cart.updatedAt
        });
      }

      if (cart) {
        console.log(`[CART SERVICE] Found existing cart: ${cart.id} with ${cart.items?.length || 0} items`);
      } else {
        console.log(`[CART SERVICE] No cart found, creating new one`);
        // If no cart exists, create a new one
        cart = await Cart.create({
          user_id: userId || null,
          session_id: userId ? null : sessionId,
          is_guest: !userId,
        }, { transaction: t });
        
        console.log(`[CART SERVICE] Created new cart: ${cart.id}`);
        
        // Reload with includes
        cart = await Cart.findByPk(cart.id, {
          include: cartIncludeOptions,
          transaction: t
        });
        
        console.log(`[CART SERVICE] Reloaded cart with ${cart.items?.length || 0} items`);
      }

      return cart;
    } catch (error) {
      console.error('[CART SERVICE] Error in getOrCreateCart:', error);
      throw error;
    }
  };

  // Use existing transaction or create a new one
  if (transaction) {
    return findOrCreateCart(transaction);
  }
  
  return db.sequelize.transaction(findOrCreateCart);
}

/**
 * Add or update item in cart
 * @param {string} sessionId - Session ID
 * @param {number} productId - Product ID to add
 * @param {number} quantity - Quantity to add
 * @param {number} [userId] - User ID if authenticated
 * @returns {Promise<Object>} Updated cart
 */
async function addItem(sessionId, productId, quantity, userId = null) {
  return db.sequelize.transaction(async (transaction) => {
    // Get or create cart
    const cart = await getOrCreateCart(sessionId, userId, { transaction });
    
    // Find existing cart item
    // Check if item already exists in cart
    const existingItem = await CartItem.findOne({
      where: { 
        cart_id: cart.id, 
        product_id: productId 
      },
      transaction
    });

    if (existingItem) {
      // If item exists, use updateItem to handle the quantity update
      return updateItem(sessionId, productId, existingItem.quantity + quantity, userId);
    }

    // For new items, check inventory and create the item
    const productDetails = await Product.findByPk(productId, { 
      attributes: ['id', 'selling_price'],
      transaction,
      include: [{
        model: db.Inventory,
        as: 'inventory',
        attributes: ['quantity'],
        required: false
      }]
    });

    if (!productDetails) {
      const error = new Error('Product not found');
      error.status = 404;
      throw error;
    }

    // Check available inventory
    const availableQuantity = productDetails.inventory?.quantity || 0;
    if (availableQuantity <= 0) {
      const error = new Error('Product is out of stock');
      error.status = 400;
      throw error;
    }

    const finalQuantity = Math.min(quantity, availableQuantity);
    if (finalQuantity <= 0) {
      const error = new Error('Invalid quantity');
      error.status = 400;
      throw error;
    }

    // Create new cart item with the requested quantity
    await CartItem.create({
      cart_id: cart.id,
      product_id: productId,
      quantity: finalQuantity,
      price: productDetails.selling_price
    }, { transaction });

    // Return updated cart
    return cart.reload({
      include: cartIncludeOptions,
      transaction
    });
  });
}

/**
 * Merge guest cart with user cart after login
 * @param {string} sessionId - Guest session ID
 * @param {number} userId - User ID
 * @returns {Promise<Cart>} Merged cart
 */
async function mergeCarts(sessionId, userId, options = {}) {
  const { transaction: externalTransaction } = options;
  console.log(`[CART SERVICE] ====== STARTING CART MERGE ======`);
  console.log(`[CART SERVICE] Session ID: ${sessionId}`);
  console.log(`[CART SERVICE] User ID: ${userId}`);
  console.log(`[CART SERVICE] Transaction: ${externalTransaction ? 'External' : 'New'}`);
  console.log(`[CART SERVICE] Current time: ${new Date().toISOString()}`);
  
  const mergeCartsTransaction = async (t) => {
    try {
      // Find guest cart with all items
      console.log(`[CART SERVICE] Looking for guest cart with sessionId: ${sessionId}`);
      
      // Log all carts with this session ID for debugging
      const allCarts = await Cart.findAll({
        where: { session_id: sessionId },
        raw: true
      });
      console.log(`[CART SERVICE] Found ${allCarts.length} carts with session ID ${sessionId}:`, allCarts);
      
      const guestCart = await Cart.findOne({
        where: { 
          session_id: sessionId, 
          is_guest: true 
        },
        include: [
          {
            model: CartItem,
            as: 'items',
            include: [{
              model: db.Product,
              as: 'product',
              include: [{
                model: db.Inventory,
                as: 'inventory',
                required: false
              }]
            }]
          }
        ],
        transaction: t
      });

      if (!guestCart) {
        console.log(`[CART SERVICE] No guest cart found for session: ${sessionId}`);
        // Check if there are any carts with this session ID at all
        const anyCart = await Cart.findOne({
          where: { session_id: sessionId },
          transaction: t
        });
        console.log(`[CART SERVICE] Any cart with session ${sessionId}:`, anyCart ? 'Found' : 'Not found');
        return null;
      }
      
      console.log(`[CART SERVICE] Found guest cart with ${guestCart.items?.length || 0} items`);
      if (guestCart.items && guestCart.items.length > 0) {
        console.log('[CART SERVICE] Guest cart items:', 
          guestCart.items.map(item => ({
            id: item.id,
            productId: item.product_id,
            quantity: item.quantity,
            product: item.product ? {
              id: item.product.id,
              title: item.product.title
            } : 'No product details'
          }))
        );
      }

      // Get or create user cart
      console.log(`[CART SERVICE] Getting or creating user cart for user: ${userId}`);
      const userCart = await getOrCreateCart(sessionId, userId, { transaction: t });
      console.log(`[CART SERVICE] User cart ID: ${userCart.id}`);

      // If guest cart has items, merge them
      if (guestCart.items && guestCart.items.length > 0) {
        console.log(`[CART SERVICE] Merging ${guestCart.items.length} items from guest cart`);
        
        for (const guestItem of guestCart.items) {
          console.log(`[CART SERVICE] Processing item - Product: ${guestItem.product_id}, Qty: ${guestItem.quantity}`);
          
          // First, try to find an existing cart item
          let userItem = await CartItem.findOne({
            where: { 
              cart_id: userCart.id, 
              product_id: guestItem.product_id 
            },
            transaction: t
          });

          // If item doesn't exist in user's cart, create it with the guest item's quantity
          if (!userItem) {
            console.log(`[CART SERVICE] Creating new cart item with quantity: ${Math.max(1, guestItem.quantity || 1)}`);
            userItem = await CartItem.create({
              cart_id: userCart.id,
              product_id: guestItem.product_id,
              quantity: Math.max(1, guestItem.quantity || 1), // Ensure minimum quantity of 1
              price: guestItem.price
            }, { transaction: t });
            console.log(`[CART SERVICE] Created new cart item with ID: ${userItem.id}`);
          } else {
            // Item exists in user's cart, only update if guest has a higher quantity
            const guestQuantity = Math.max(1, guestItem.quantity || 1);
            const currentQuantity = userItem.quantity || 0;
            
            if (guestQuantity > currentQuantity) {
              console.log(`[CART SERVICE] Updating quantity from ${currentQuantity} to ${guestQuantity} (guest had more)`);
              await userItem.update(
                { quantity: guestQuantity },
                { 
                  transaction: t,
                  validate: false
                }
              );
            } else {
              console.log(`[CART SERVICE] Keeping existing quantity ${currentQuantity} (greater than or equal to guest's ${guestQuantity})`);
            }
          }
          
          // Reload the item to get the latest quantity
          const updatedItem = await CartItem.findByPk(userItem.id, { transaction: t });
          console.log(`[CART SERVICE] Final quantity for product ${guestItem.product_id}: ${updatedItem.quantity}`);
        }
        
        // Delete guest cart
        console.log(`[CART SERVICE] Deleting guest cart: ${guestCart.id}`);
        await guestCart.destroy({ transaction: t });
        console.log('[CART SERVICE] Guest cart deleted');
      } else {
        console.log('[CART SERVICE] No items in guest cart to merge');
      }

      // Return updated user cart
      console.log('[CART SERVICE] Reloading user cart with items');
      const updatedCart = await userCart.reload({
        include: cartIncludeOptions,
        transaction: t
      });
      
      console.log(`[CART SERVICE] Cart merge completed. Final item count: ${updatedCart.items?.length || 0}`);
      return updatedCart;
      
    } catch (error) {
      console.error('[CART SERVICE] Error in mergeCarts:', error);
      throw error;
    }
  };

  // Use existing transaction or create a new one
  if (externalTransaction) {
    return mergeCartsTransaction(externalTransaction);
  }
  
  return db.sequelize.transaction(mergeCartsTransaction);
}

/**
 * Update item quantity in cart
 * @param {string} sessionId - Session ID
 * @param {number} productId - Product ID to update
 * @param {number} quantity - New quantity
 * @param {number} [userId] - User ID if authenticated
 * @returns {Promise<Object>} Updated cart
 */
async function updateItem(sessionId, productId, quantity, userId = null) {
  // Get the cart first
  const cart = await getOrCreateCart(sessionId, userId);
  
  // Find the cart item with product and inventory
  const cartItem = await CartItem.findOne({
    where: {
      cart_id: cart.id,
      product_id: productId
    },
    include: [{
      model: Product,
      as: 'product',
      include: [{
        model: Inventory,
        as: 'inventory'
      }]
    }]
  });

  if (!cartItem) {
    throw new Error('Item not found in cart');
  }

  // Update quantity
  cartItem.quantity = quantity;
  await cartItem.save();

  // Return updated cart
  return getOrCreateCart(sessionId, userId);
}

/**
 * Remove item from cart
 * @param {string} sessionId - Session ID
 * @param {number} productId - Product ID to remove
 * @param {number} [userId] - User ID if authenticated
 * @returns {Promise<Object>} Updated cart
 */
async function removeItem(sessionId, productId, userId = null) {
  // Get the cart with items
  const cart = await getOrCreateCart(sessionId, userId);
  
  // Delete the cart item within a transaction
  return db.sequelize.transaction(async (transaction) => {
    await CartItem.destroy({
      where: {
        cart_id: cart.id,
        product_id: productId
      },
      transaction
    });

    // Return updated cart with all associations
    return getOrCreateCart(sessionId, userId, { transaction });
  });
}

/**
 * Clear all items from cart
 * @param {string} sessionId - Session ID
 * @param {number} [userId] - User ID if authenticated
 * @returns {Promise<Object>} Empty cart
 */
async function clearCart(sessionId, userId = null) {
  // Get the cart first
  const cart = await getOrCreateCart(sessionId, userId);
  
  // Delete all cart items within a transaction
  return db.sequelize.transaction(async (transaction) => {
    await CartItem.destroy({
      where: { cart_id: cart.id },
      transaction
    });

    // Return empty cart with all associations
    return getOrCreateCart(sessionId, userId, { transaction });
  });
}

module.exports = {
  getOrCreateCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
  mergeCarts
};
