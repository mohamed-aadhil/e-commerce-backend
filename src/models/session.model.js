const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Session = sequelize.define('Session', {
  sid: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  expires: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  data: {
    type: DataTypes.TEXT,
    get() {
      const data = this.getDataValue('data');
      return data ? JSON.parse(data) : null;
    },
    set(value) {
      this.setDataValue('data', JSON.stringify(value));
    },
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
}, {
  tableName: 'sessions',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['expires'] },
    { fields: ['user_id'] },
  ],
});

module.exports = Session;
