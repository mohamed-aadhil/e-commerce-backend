function productDetailsDTO(product) {
  const stock = product.Inventory?.quantity ?? 0;
  let status = 'Active';
  if (stock === 0) {
    status = 'Out of Stock';
  } else if (stock < 10) {
    status = 'Low Stock';
  }
  return {
    id: product.id,
    name: product.title,
    title: product.title,
    product_type: product.product_type,
    author: product.author || null,
    images: product.images || [],
    description: product.metadata?.description || null, // assuming description is in metadata
    price: product.price,
    stock,
    status,
    metadata: product.metadata || {},
    // Add genres and audiences
    genres: (product.Genres || []).map(g => ({
      id: g.id,
      name: g.name
    })),
    audiences: (product.Audiences || []).map(a => ({
      id: a.id,
      name: a.name
    }))
  };
}

module.exports = { productDetailsDTO };