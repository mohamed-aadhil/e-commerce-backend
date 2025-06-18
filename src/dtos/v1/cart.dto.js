import { body, param } from 'express-validator';

// Validation rules for cart operations
export const cartValidation = {
  // Validation for adding an item to cart
  addItem: [
    body('productId')
      .isInt({ min: 1 })
      .withMessage('Valid product ID is required'),
    body('quantity')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Quantity must be at least 1'),
  ],
  
  // Validation for checkout
  checkout: [
    body('addressId')
      .isInt({ min: 1 })
      .withMessage('Valid address ID is required'),
    body('shippingMethod')
      .optional()
      .isString()
      .isIn(['standard', 'express', 'overnight'])
      .withMessage('Invalid shipping method'),
    body('paymentMethod')
      .optional()
      .isString()
      .isIn(['credit_card', 'paypal', 'cod'])
      .withMessage('Invalid payment method'),
  ],

  // Validation for updating cart item quantity
  updateItem: [
    param('productId')
      .isInt({ min: 1 })
      .withMessage('Valid product ID is required'),
    body('quantity')
      .isInt({ min: 0 })
      .withMessage('Valid quantity is required'),
  ],

  // Validation for removing an item from cart
  removeItem: [
    param('productId')
      .isInt({ min: 1 })
      .withMessage('Valid product ID is required'),
  ],
};

// Format cart response to match frontend's CartItem interface
export const cartResponseDTO = (cart) => {
  if (!cart) return null;

  return {
    id: cart.id,
    user_id: cart.user_id,
    is_guest: cart.is_guest,
    items: cart.items ? cart.items.map(item => {
      // Check if product data is nested under 'product' or directly on item
      const product = item.product || {};
      const inventory = product.inventory || {};
      
      return {
        id: item.id,
        quantity: item.quantity,
        price: item.price || product.selling_price,
        product: {
          id: product.id || item.product_id,
          title: product.title || 'Product',
          selling_price: product.selling_price || item.price,
          images: product.images || [],
          inventory: {
            quantity: inventory.quantity || 0
          }
        }
      };
    }) : [],
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt
  };
};

// All exports are now named exports
