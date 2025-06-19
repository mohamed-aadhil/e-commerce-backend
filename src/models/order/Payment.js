module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define('Payment', {
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
      comment: 'Reference to the order this payment is for',
    },
    payment_method: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'e.g., credit_card, paypal',
    },
    payment_status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed'),
      allowNull: false,
      defaultValue: 'pending',
      comment: 'Current status of the payment',
    },
    transaction_id: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Transaction ID from payment gateway',
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
      comment: 'Payment amount',
    },
    paid_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the payment was successfully processed',
    },
    refunded_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the payment was refunded, if applicable',
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
      onUpdate: DataTypes.NOW,
    },
  }, {
    tableName: 'payments',
    timestamps: false, // We're using created_at/updated_at manually
    underscored: true,
    indexes: [
      { fields: ['order_id'] },
      { fields: ['payment_status'] },
      { fields: ['transaction_id'] },
    ],
  });

  Payment.associate = (models) => {
    // Each payment belongs to one order
    Payment.belongsTo(models.Order, {
      foreignKey: 'order_id',
      as: 'order',
      onDelete: 'CASCADE',
    });
  };

  return Payment;
};