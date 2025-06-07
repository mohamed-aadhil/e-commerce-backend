const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const Order = require('./Order');
const Address = require('../user/Address');

const Shipping = sequelize.define('Shipping', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Order,
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  address_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Address,
      key: 'id',
    },
    onDelete: 'SET NULL',
  },
  shipping_method: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  shipping_status: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  tracking_number: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  shipped_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  delivered_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'shipping',
  timestamps: false,
});

Shipping.belongsTo(Order, { foreignKey: 'order_id', onDelete: 'CASCADE' });
Order.hasOne(Shipping, { foreignKey: 'order_id', onDelete: 'CASCADE' });
Shipping.belongsTo(Address, { foreignKey: 'address_id', onDelete: 'SET NULL' });
Address.hasMany(Shipping, { foreignKey: 'address_id', onDelete: 'SET NULL' });

module.exports = Shipping; 