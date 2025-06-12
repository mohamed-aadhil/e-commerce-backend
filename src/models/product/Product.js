const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  product_type: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: 'new_book',
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  images: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  author: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'products',
  timestamps: false,
});

module.exports = Product; 