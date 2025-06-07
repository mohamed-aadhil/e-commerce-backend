const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const Product = require('./Product');

const NewBook = sequelize.define('NewBook', {
  product_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: Product,
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  author: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
}, {
  tableName: 'new_books',
  timestamps: false,
});

// Association
NewBook.belongsTo(Product, { foreignKey: 'product_id', onDelete: 'CASCADE' });
Product.hasOne(NewBook, { foreignKey: 'product_id', onDelete: 'CASCADE' });

module.exports = NewBook; 