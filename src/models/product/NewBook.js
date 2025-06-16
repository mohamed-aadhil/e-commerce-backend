module.exports = (sequelize, DataTypes) => {
  const NewBook = sequelize.define('NewBook', {
    product_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'products',  // Use table name here to avoid circular dependency
        key: 'id',
      },
      onDelete: 'CASCADE',
    }
  }, {
    tableName: 'new_books',
    timestamps: false,
  });

  NewBook.associate = (models) => {
    NewBook.belongsTo(models.Product, { 
      foreignKey: 'product_id',
      as: 'product',
      onDelete: 'CASCADE'
    });
  };

  return NewBook;
};