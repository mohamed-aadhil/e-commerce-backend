module.exports = (sequelize, DataTypes) => {
  const Cart = sequelize.define('Cart', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,  // Allow null for guest users
      unique: true,     // Only one cart per user
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    session_id: {
      type: DataTypes.STRING,
      allowNull: true,  // Will be set for guest users
      unique: true,     // Only one cart per session
      comment: 'For guest users',
    },
    is_guest: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,  // Default to guest cart
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
    tableName: 'carts',
    timestamps: true,  // Use Sequelize's built-in timestamps (created_at, updated_at)
    underscored: true,
    indexes: [
        // For finding user's cart (only one cart per user)
      { 
        fields: ['user_id'], 
        unique: true, 
        where: { is_guest: false } 
      },
      // For finding guest's cart (only one cart per session)
      { 
        fields: ['session_id'], 
        unique: true, 
        where: { is_guest: true } 
      }
    ],
  });

  Cart.associate = (models) => {
    // Cart belongs to User (one-to-one)
    Cart.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE',
    });
    
    // Cart has many CartItems
    Cart.hasMany(models.CartItem, {
      foreignKey: 'cart_id',
      as: 'items',
      onDelete: 'CASCADE',
    });
  };

  return Cart;
};