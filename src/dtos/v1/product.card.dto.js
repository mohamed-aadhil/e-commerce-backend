function productCardDTO(product) {
  const stock = product.inventory?.quantity ?? 0;
  let status = 'In Stock';
  if (stock === 0) {
    status = 'Out of Stock';
  } else if (stock < 10) {
    status = 'Low Stock';
  }
  return {
    id: product.id,
    name: product.title,
    author: product.author || null,
    images: product.images || [],
    selling_price: product.selling_price,
    status: status,
    inventory: {
      quantity: stock
    }
  };
}

module.exports = { productCardDTO };