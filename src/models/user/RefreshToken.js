const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const User = require('./User');

const RefreshToken = sequelize.define('RefreshToken', {
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
  token: {
    type: DataTypes.TEXT,
    allowNull: false,
    unique: true,
  },
  issued_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  revoked: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  replaced_by_token: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'refresh_tokens',
  timestamps: false,
});

RefreshToken.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
User.hasMany(RefreshToken, { foreignKey: 'user_id', onDelete: 'CASCADE' });

module.exports = RefreshToken; 