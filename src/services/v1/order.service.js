const db = require('../../models');
const { Op } = require('sequelize');
const shippingService = require('./shipping.service');
const paymentService = require('./payment.service');

/**
 * Create order items and calculate total
 */
const prepareOrderItems = async (items, transaction) => {
  let orderTotal = 0;
  const orderItems = [];
  const inventoryUpdates = [];
  const productIds = [];

  // Validate and prepare each item
  for (const item of items) {
    const { productId, quantity } = item;
    
    if (!productId || !quantity || quantity < 1) {
      const error = new Error('Invalid product data');
      error.status = 400;
      throw error;
    }

    // Get product details
    const product = await db.Product.findByPk(productId, { transaction });
    if (!product) {
      const error = new Error(`Product not found: ${productId}`);
      error.status = 404;
      throw error;
    }

    // Check inventory
    const inventory = await db.Inventory.findOne({
      where: { product_id: product.id },
      transaction
    });

    if (!inventory || inventory.quantity < quantity) {
      const error = new Error(`Insufficient stock for product: ${product.title}`);
      error.status = 400;
      throw error;
    }

    const price = product.selling_price;
    orderTotal += price * quantity;
    orderItems.push({
      product_id: product.id,
      quantity,
      price
    });

    // Track product IDs for duplicate check
    if (productIds.includes(product.id)) {
      const error = new Error('Duplicate product in order');
      error.status = 400;
      throw error;
    }
    productIds.push(product.id);

    // Prepare inventory update
    inventoryUpdates.push(
      inventory.decrement('quantity', { by: quantity, transaction })
    );
  }

  return { orderItems, orderTotal, inventoryUpdates };
};

/**
 * Create a new order (supports both cart and direct purchase)
 */
const createOrder = async (userId, { 
  addressId, 
  items: directItems,
  shippingMethod = 'standard',
  paymentMethod = 'credit_card'
}) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    // 1. Verify address belongs to user and get user details
    const [address, user] = await Promise.all([
      db.Address.findOne({
        where: { id: addressId, user_id: userId },
        transaction
      }),
      db.User.findByPk(userId, {
        attributes: ['id', 'email', 'name'],
        transaction
      })
    ]);

    if (!address) {
      const error = new Error('Address not found');
      error.status = 404;
      throw error;
    }

    let orderItems = [];
    let orderTotal = 0;
    let inventoryUpdates = [];

    if (directItems && directItems.length > 0) {
      // Direct purchase flow (Buy Now)
      const result = await prepareOrderItems(directItems, transaction);
      orderItems = result.orderItems;
      orderTotal = result.orderTotal;
      inventoryUpdates = result.inventoryUpdates;
    } else {
      // Cart checkout flow
      const cart = await db.Cart.findOne({
        where: { user_id: userId },
        include: [{
          model: db.CartItem,
          include: [db.Product]
        }],
        transaction
      });

      if (!cart || !cart.CartItems || cart.CartItems.length === 0) {
        const error = new Error('No items in cart');
        error.status = 400;
        throw error;
      }

      const result = await prepareOrderItems(
        cart.CartItems.map(item => ({
          productId: item.product_id,
          quantity: item.quantity
        })),
        transaction
      );
      orderItems = result.orderItems;
      orderTotal = result.orderTotal;
      inventoryUpdates = result.inventoryUpdates;

      // Clear cart after successful order creation
      await db.CartItem.destroy({
        where: { cart_id: cart.id },
        transaction
      });
    }

    // Calculate shipping cost
    const shippingCost = await shippingService.calculateShippingCost({
      shippingMethod,
      itemCount: orderItems.length,
      totalWeight: 0, // In a real app, calculate total weight from products
    });

    // Create order with shipping details
    const order = await db.Order.create({
      user_id: userId,
      status: 'pending',
      payment_status: 'pending',
      shipping_address_id: addressId,
      shipping_method: shippingMethod,
      shipping_cost: shippingCost,
      total: orderTotal + shippingCost, // Include shipping in total
      OrderItems: orderItems
    }, {
      include: [db.OrderItem],
      transaction
    });

    // Update inventory
    await Promise.all(inventoryUpdates);

    // Create shipping record
    await shippingService.createShippingRecord({
      orderId: order.id,
      addressId,
      shippingMethod,
      shippingCost
    }, transaction);

    // Create initial payment record
    const payment = await paymentService.createPayment(
      order.id,
      order.total,
      paymentMethod,
      transaction
    );
    
    // Add payment details to order
    order.payment = payment;

    // Associate payment with order
    order.payment_id = payment.id;
    await order.save({ transaction });

    await transaction.commit();

    // Return order details
    return getOrderById(order.id, userId);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Get order by ID (with items and shipping info)
 */
const getOrderById = async (orderId, userId) => {
  const order = await db.Order.findOne({
    where: { 
      id: orderId,
      ...(userId && { user_id: userId }) // If userId is provided, filter by it
    },
    include: [
      {
        model: db.OrderItem,
        include: [{
          model: db.Product,
          attributes: ['id', 'title', 'author', 'images']
        }]
      },
      {
        model: db.Shipping,
        as: 'shipping',
        include: [{
          model: db.Address,
          as: 'address'
        }]
      },
      {
        model: db.Address,
        as: 'shippingAddress',
        attributes: { exclude: ['created_at', 'updated_at'] }
      },
      {
        model: db.Payment,
        as: 'orderPayment',
        attributes: { exclude: ['created_at', 'updated_at'] }
      }
    ]
  });

  if (!order) {
    const error = new Error('Order not found');
    error.status = 404;
    throw error;
  }

  return order.get({ plain: true });
};

/**
 * Get all orders for a user
 */
const getUserOrders = async (userId, { page = 1, limit = 10 }) => {
  const offset = (page - 1) * limit;
  
  const { count, rows } = await db.Order.findAndCountAll({
    where: { user_id: userId },
    order: [['created_at', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset),
    include: [
      {
        model: db.OrderItem,
        include: [{
          model: db.Product,
          attributes: ['id', 'title', 'author', 'images']
        }]
      },
      {
        model: db.Shipping,
        include: [db.Address]
      }
    ]
  });

  return {
    data: rows.map(order => order.get({ plain: true })),
    pagination: {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit)
    }
  };
};

/**
 * Cancel an order
 */
const cancelOrder = async (orderId, userId) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    // 1. Find the order
    const order = await db.Order.findOne({
      where: { 
        id: orderId,
        user_id: userId,
        status: 'pending' // Only pending orders can be cancelled
      },
      include: [db.OrderItem],
      transaction
    });

    if (!order) {
      const error = new Error('Order not found or cannot be cancelled');
      error.status = 404;
      throw error;
    }

    // 2. Update order status
    await order.update({ status: 'cancelled' }, { transaction });

    // 3. Restore inventory
    for (const item of order.OrderItems) {
      await db.Inventory.increment('quantity', {
        by: item.quantity,
        where: { product_id: item.product_id },
        transaction
      });
    }

    // 4. Update shipping status
    await db.Shipping.update(
      { shipping_status: 'cancelled' },
      { where: { order_id: orderId }, transaction }
    );

    await transaction.commit();

    return getOrderById(orderId, userId);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

module.exports = {
  createOrder,
  getOrderById,
  getUserOrders,
  cancelOrder
};
