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
    },
    payment_method: {
      type: DataTypes.ENUM(
        'credit_card',
        'debit_card',
        'paypal',
        'stripe',
        'bank_transfer',
        'cash_on_delivery',
        'other'
      ),
      allowNull: false,
    },
    payment_gateway: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'e.g., Stripe, PayPal, Authorize.net',
    },
    transaction_id: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Gateway transaction ID',
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'USD',
    },
    status: {
      type: DataTypes.ENUM(
        'pending',
        'authorized',
        'captured',
        'refunded',
        'partially_refunded',
        'voided',
        'failed',
        'disputed',
        'succeeded'
      ),
      allowNull: false,
      defaultValue: 'pending',
    },
    card_last4: {
      type: DataTypes.STRING(4),
      allowNull: true,
    },
    card_brand: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'e.g., Visa, MasterCard, Amex',
    },
    card_exp_month: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 12,
      },
    },
    card_exp_year: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    billing_address: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Snapshot of billing address at time of payment',
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional payment gateway response data',
    },
    failure_code: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Error code if payment failed',
    },
    failure_message: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Error message if payment failed',
    },
    refunded_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    paid_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    refunded_at: {
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
    tableName: 'payments',
    timestamps: false,
    underscored: true,
    indexes: [
      { fields: ['order_id'] },
      { fields: ['transaction_id'], unique: true },
      { fields: ['status'] },
      { fields: ['payment_method'] },
    ],
  });

  Payment.associate = (models) => {
    // Payment belongs to Order
    Payment.belongsTo(models.Order, {
      foreignKey: 'order_id',
      as: 'order',
      onDelete: 'CASCADE',
    });
  };

  return Payment;
};