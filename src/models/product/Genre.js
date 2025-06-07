const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Genre = sequelize.define('Genre', {
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
  tableName: 'genres',
  timestamps: false,
});

module.exports = Genre; 