const NewBook = require('../models/product/NewBook');
const sequelize = require('../config/database');

async function seedNewBooks() {
  await sequelize.sync();
  await NewBook.bulkCreate([
    {
      product_id: 1,
      author: 'F. Scott Fitzgerald',
    },
    {
      product_id: 2,
      author: 'Harper Lee',
    },
    {
      product_id: 3,
      author: 'George Orwell',
    },
  ], { ignoreDuplicates: true });
  console.log('NewBook seed completed.');
}

module.exports = seedNewBooks; 