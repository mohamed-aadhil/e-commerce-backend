const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const Order = require('./Order');

const Payment = sequelize.define('Payment', {
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
  payment_method: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  payment_status: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  transaction_id: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  paid_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'payments',
  timestamps: false,
});

Payment.belongsTo(Order, { foreignKey: 'order_id', onDelete: 'CASCADE' });
Order.hasMany(Payment, { foreignKey: 'order_id', onDelete: 'CASCADE' });

module.exports = Payment; 