const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    email: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password_hash: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    role: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: 'customer',
      validate: {
        isIn: [['customer', 'admin']],
      },
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'users',
    timestamps: false,
    underscored: true,
  });

  User.associate = (models) => {
    // User has many Addresses
    User.hasMany(models.Address, {
      foreignKey: 'user_id',
      as: 'addresses',
      onDelete: 'CASCADE'
    });
    
    // User has many RefreshTokens
    User.hasMany(models.RefreshToken, {
      foreignKey: 'user_id',
      as: 'refreshTokens',
      onDelete: 'CASCADE'
    });
    
    // User has many Orders
    User.hasMany(models.Order, {
      foreignKey: 'user_id',
      as: 'orders',
      onDelete: 'SET NULL'
    });
    
    // User has one Cart
    User.hasOne(models.Cart, {
      foreignKey: 'user_id',
      as: 'cart',
      onDelete: 'CASCADE'
    });
    
    // User has many Ratings
    User.hasMany(models.Rating, {
      foreignKey: 'user_id',
      as: 'ratings',
      onDelete: 'CASCADE'
    });
    
    // User has many Reviews
    User.hasMany(models.Review, {
      foreignKey: 'user_id',
      as: 'reviews',
      onDelete: 'CASCADE'
    });
  };

  return User;
};