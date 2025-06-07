const Product = require('../models/product/Product');
const sequelize = require('../config/database');

async function seedProducts() {
  await sequelize.sync();
  await Product.bulkCreate([
    {
      title: 'The Great Gatsby',
      price: 10.99,
      product_type: 'new_book',
      metadata: { isbn: '9780743273565' },
    },
    {
      title: 'To Kill a Mockingbird',
      price: 8.99,
      product_type: 'new_book',
      metadata: { isbn: '9780061120084' },
    },
    {
      title: '1984',
      price: 9.99,
      product_type: 'new_book',
      metadata: { isbn: '9780451524935' },
    },
  ], { ignoreDuplicates: true });
  console.log('Product seed completed.');
}

module.exports = seedProducts; 