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
    name: product.title, // 'name' as per your request, mapped from 'title'
    author: product.NewBook?.author || null,
    images: product.images || [],
    description: product.metadata?.description || null, // assuming description is in metadata
    price: product.price,
    stock,
    status,
    metadata: product.metadata || {},
  };
}

module.exports = { productDetailsDTO }; 