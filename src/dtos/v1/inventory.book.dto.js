function inventoryBookDTO(product) {
  const quantity = Number(product.Inventory?.quantity ?? 0);
  return {
    productId: product.id, 
    name: product.title,
    author: product.NewBook?.author || null,
    genres: product.Genres ? product.Genres.map(g => g.name) : [],
    price: product.price,
    stock: quantity,
    status: quantity === 0
      ? 'Out of Stock'
      : quantity < 10
        ? 'Low Stock'
        : 'Active',
  };
}

module.exports = { inventoryBookDTO }; 