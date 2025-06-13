/**
 * Cart DTO (Data Transfer Object)
 * Formats cart data for API responses
 */
/**
 * Format cart data for API responses
 * @param {Object} cart - Cart object from database
 * @returns {Object} Formatted cart DTO
 */
const formatCart = (cart = {}) => {
  const result = {
    id: cart.id || null,
    userId: cart.user_id || cart.userId || null,
    items: [],
    itemCount: 0,
    subtotal: 0,
    total: 0,
    createdAt: cart.created_at || new Date().toISOString(),
    updatedAt: cart.updated_at || new Date().toISOString()
  };

  // Process items if provided
  if (cart.CartItems && Array.isArray(cart.CartItems)) {
    result.items = cart.CartItems.map(item => ({
      id: item.id,
      product: {
        id: item.Product?.id,
        name: item.Product?.title || 'Unknown Product',
        price: parseFloat(item.Product?.price || 0),
        image: item.Product?.images?.[0] || null,
        inventory: item.Product?.Inventory?.quantity || 0
      },
      quantity: parseInt(item.quantity, 10) || 1,
      subtotal: parseFloat((parseFloat(item.Product?.price || 0) * parseInt(item.quantity, 10)).toFixed(2))
    }));
  } else if (cart.items && Array.isArray(cart.items)) {
    result.items = cart.items.map(item => ({
      ...item,
      quantity: parseInt(item.quantity, 10) || 1,
      subtotal: parseFloat((parseFloat(item.product?.price || 0) * parseInt(item.quantity, 10)).toFixed(2))
    }));
  }

  // Calculate totals
  result.itemCount = result.items.reduce((sum, item) => sum + item.quantity, 0);
  result.subtotal = parseFloat(result.items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));
  result.total = result.subtotal; // Can be extended with taxes, shipping, etc.

  return result;
};

/**
 * Create an empty cart DTO
 * @returns {Object} Empty cart DTO
 */
const emptyCart = () => {
  return formatCart({
    id: null,
    user_id: null,
    CartItems: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
};

module.exports = {
  formatCart,
  emptyCart
};
