function inventoryBookDTO(product) {
  // Handle case where inventory might be an array or single object
  let quantity = 0;
  
  if (Array.isArray(product.inventory) && product.inventory.length > 0) {
    quantity = Number(product.inventory[0].quantity) || 0;
  } else if (product.inventory && typeof product.inventory === 'object') {
    quantity = Number(product.inventory.quantity) || 0;
  }
  
  return {
    productId: product.id, 
    name: product.title,
    author: product.author || null,
    genres: product.genres ? product.genres.map(g => g.name) : [],
    selling_price: product.selling_price,
    cost_price: product.cost_price,
    stock: quantity,
    status: quantity === 0
      ? 'Out of Stock'
      : quantity < 10
        ? 'Low Stock'
        : 'Active',
  };
}

module.exports = { inventoryBookDTO };