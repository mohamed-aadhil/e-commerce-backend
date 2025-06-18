module.exports = (sequelize, DataTypes) => {
  const Shipping = sequelize.define('Shipping', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'orders',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    address_id: {
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
    shipping_status: {
      type: DataTypes.ENUM(
        'pending',
        'shipped',
        'delivered',
        'cancelled'
      ),
      allowNull: false,
      defaultValue: 'pending',
    },
    shipping_cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    tracking_number: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    shipped_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    delivered_at: {
      type: DataTypes.DATE,
      allowNull: true,
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
    tableName: 'shipping',
    timestamps: false,
    underscored: true,
    indexes: [
      { fields: ['order_id'] },
      { fields: ['tracking_number'] },
      { fields: ['shipping_status'] },
    ],
  });

  Shipping.associate = (models) => {
    // Shipping belongs to Order (one-to-one)
    Shipping.belongsTo(models.Order, {
      foreignKey: 'order_id',
      as: 'order',
      onDelete: 'CASCADE',
    });
    
    // Shipping belongs to Address (shipping address)
    Shipping.belongsTo(models.Address, {
      foreignKey: 'address_id',
      as: 'address',
      onDelete: 'SET NULL',
    });
  };

  return Shipping;
};