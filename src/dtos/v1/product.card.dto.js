function productCardDTO(product) {
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
    author: product.author || null,
    image: product.images && product.images.length > 0 ? product.images[0] : null,
    price: product.price,
    status,
  };
}

module.exports = { productCardDTO }; 