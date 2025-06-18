module.exports = (sequelize, DataTypes) => {
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
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    status: {
      type: DataTypes.ENUM(
        'pending', 
        'paid', 
        'shipped', 
        'delivered', 
        'cancelled'
      ),
      allowNull: false,
      defaultValue: 'pending',
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    payment_status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed'),
      allowNull: false,
      defaultValue: 'pending',
    },
    shipping_address_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'addresses',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    shipping_method: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'e.g., standard, express'
    },
    shipping_cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    payment_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'payments',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'orders',
    timestamps: false,
    underscored: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['status'] },
      { fields: ['payment_status'] },
    ],
  });

  Order.associate = (models) => {
    // Order belongs to User
    Order.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'SET NULL'
    });
    
    // Order has many OrderItems
    Order.hasMany(models.OrderItem, {
      foreignKey: 'order_id',
      as: 'items',
      onDelete: 'CASCADE'
    });
    
    // Order has one Payment
    Order.hasOne(models.Payment, {
      foreignKey: 'order_id',
      as: 'payment',
      onDelete: 'SET NULL'
    });
    
    // Order belongs to Payment (for payment_id foreign key)
    Order.belongsTo(models.Payment, {
      foreignKey: 'payment_id',
      as: 'orderPayment',
      onDelete: 'SET NULL'
    });
    
    // Order has one Shipping
    Order.hasOne(models.Shipping, {
      foreignKey: 'order_id',
      as: 'shipping',
      onDelete: 'SET NULL'
    });
    
    // Order belongs to Payment (for payment_id foreign key)
    Order.belongsTo(models.Payment, {
      foreignKey: 'payment_id',
      as: 'orderPayment',
      onDelete: 'SET NULL'
    });
    
    // Order belongs to Address (shipping address)
    Order.belongsTo(models.Address, {
      foreignKey: 'shipping_address_id',
      as: 'shippingAddress',
      onDelete: 'SET NULL'
    });
  };

  return Order;
};