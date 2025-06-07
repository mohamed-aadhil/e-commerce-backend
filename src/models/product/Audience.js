const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Audience = sequelize.define('Audience', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.TEXT,
    allowNull: false,
    unique: true,
  },
}, {
  tableName: 'audiences',
  timestamps: false,
});

module.exports = Audience; 