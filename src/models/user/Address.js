const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const User = require('./User');

const Address = sequelize.define('Address', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  recipient_name: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  address_line1: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  address_line2: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  city: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  state: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  postal_code: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  country: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  mobile_number: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'addresses',
  timestamps: false,
});

Address.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
User.hasMany(Address, { foreignKey: 'user_id', onDelete: 'CASCADE' });

module.exports = Address; 