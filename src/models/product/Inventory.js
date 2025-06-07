const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const Product = require('./Product');

const Inventory = sequelize.define('Inventory', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Product,
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'inventory',
  timestamps: false,
});

Inventory.belongsTo(Product, { foreignKey: 'product_id', onDelete: 'CASCADE' });
Product.hasOne(Inventory, { foreignKey: 'product_id', onDelete: 'CASCADE' });

module.exports = Inventory; 