const { Sequelize, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const path = require('path');
const fs = require('fs');

const db = {};

// Import models
const modelFiles = [
  // User models
  { path: './user/User.js', name: 'User' },
  { path: './user/Address.js', name: 'Address' },
  { path: './user/RefreshToken.js', name: 'RefreshToken' },
  
  // Product models
  { path: './product/Product.js', name: 'Product' },
  { path: './product/NewBook.js', name: 'NewBook' },
  { path: './product/Genre.js', name: 'Genre' },
  { path: './product/Audience.js', name: 'Audience' },
  { path: './product/BookGenre.js', name: 'BookGenre' },
  { path: './product/BookAudience.js', name: 'BookAudience' },
  { path: './product/Inventory.js', name: 'Inventory' },
  { path: './product/InventoryTransaction.js', name: 'InventoryTransaction' },
  { path: './product/Rating.js', name: 'Rating' },
  { path: './product/Review.js', name: 'Review' },
  
  // Order models
  { path: './order/Order.js', name: 'Order' },
  { path: './order/OrderItem.js', name: 'OrderItem' },
  { path: './order/Cart.js', name: 'Cart' },
  { path: './order/CartItem.js', name: 'CartItem' },
  { path: './order/Shipping.js', name: 'Shipping' },
  { path: './order/Payment.js', name: 'Payment' }
];

// Load models
modelFiles.forEach(({ path: modelPath, name }) => {
  try {
    const model = require(path.join(__dirname, modelPath))(sequelize, DataTypes);
    db[model.name] = model;
  } catch (error) {
    console.error(`Error loading model ${name} from ${modelPath}:`, error);
  }
});

// Setup associations after all models are loaded
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
