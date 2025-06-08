function inventoryBookDTO(product) {
  return {
    productId: product.metadata?.isbn || product.id, // Prefer ISBN if available
    name: product.title,
    author: product.NewBook?.author || null,
    genres: product.Genres ? product.Genres.map(g => g.name) : [],
    price: product.price,
    stock: product.Inventory?.quantity ?? 0,
    status: product.Inventory?.quantity === 0
      ? 'Out of Stock'
      : product.Inventory?.quantity < 10
        ? 'Low Stock'
        : 'Active',
  };
}

module.exports = { inventoryBookDTO }; 