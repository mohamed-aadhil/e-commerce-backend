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
      allowNull: false,
      comment: 'e.g., standard, express, next-day',
    },
    shipping_carrier: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'e.g., UPS, FedEx, USPS',
    },
    tracking_number: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    tracking_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(
        'pending',
        'processing',
        'shipped',
        'in_transit',
        'out_for_delivery',
        'delivered',
        'returned',
        'cancelled'
      ),
      allowNull: false,
      defaultValue: 'pending',
    },
    cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    weight: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Weight in grams',
    },
    dimensions: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Package dimensions {length, width, height, unit}',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
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
    estimated_delivery: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      onUpdate: DataTypes.NOW,
    },
  }, {
    tableName: 'shipping',
    timestamps: false,
    underscored: true,
    indexes: [
      { fields: ['order_id'], unique: true },
      { fields: ['tracking_number'] },
      { fields: ['status'] },
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