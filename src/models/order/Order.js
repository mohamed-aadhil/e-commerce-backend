const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const User = require('../user/User');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: User,
      key: 'id',
    },
    onDelete: 'SET NULL',
  },
  status: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      isIn: [['pending', 'paid', 'shipped', 'delivered', 'cancelled']],
    },
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'orders',
  timestamps: false,
});

Order.belongsTo(User, { foreignKey: 'user_id', onDelete: 'SET NULL' });
User.hasMany(Order, { foreignKey: 'user_id', onDelete: 'SET NULL' });

module.exports = Order; 