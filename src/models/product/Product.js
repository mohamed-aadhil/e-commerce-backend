module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    selling_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    cost_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    product_type: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: 'new_book',
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    images: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    author: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'products',
    timestamps: false,
    underscored: true,
    hooks: {
      beforeValidate: (product) => {
        if (product.selling_price < product.cost_price) {
          throw new Error('Selling price cannot be less than cost price');
        }
      }
    }
  });

  Product.associate = (models) => {
    // Product has one NewBook (one-to-one)
    Product.hasOne(models.NewBook, {
      foreignKey: 'product_id',
      as: 'newBook',
      onDelete: 'CASCADE'
    });
    
    // Product has one Inventory (one-to-one)
    Product.hasOne(models.Inventory, {
      foreignKey: 'product_id',
      as: 'inventory',
      onDelete: 'CASCADE'
    });
    
    // Product has many InventoryTransactions (one-to-many)
    Product.hasMany(models.InventoryTransaction, {
      foreignKey: 'product_id',
      as: 'inventoryTransactions',
      onDelete: 'CASCADE'
    });

    // Product has many OrderItems (one-to-many)
    Product.hasMany(models.OrderItem, {
      foreignKey: 'product_id',
      as: 'orderItems',
      onDelete: 'SET NULL'
    });

    // Product has many CartItems (one-to-many)
    Product.hasMany(models.CartItem, {
      foreignKey: 'product_id',
      as: 'cartItems',
      onDelete: 'CASCADE'
    });

    // Product has many Ratings (one-to-many)
    Product.hasMany(models.Rating, {
      foreignKey: 'product_id',
      as: 'ratings',
      onDelete: 'CASCADE'
    });

    // Product has many Reviews (one-to-many)
    Product.hasMany(models.Review, {
      foreignKey: 'product_id',
      as: 'reviews',
      onDelete: 'CASCADE'
    });

    // Product belongs to many Genres (many-to-many through BookGenre)
    Product.belongsToMany(models.Genre, {
      through: models.BookGenre,
      foreignKey: 'book_id',
      otherKey: 'genre_id',
      as: 'genres',
      onDelete: 'CASCADE'
    });

    // Product belongs to many Audiences (many-to-many through BookAudience)
    Product.belongsToMany(models.Audience, {
      through: models.BookAudience,
      foreignKey: 'book_id',
      otherKey: 'audience_id',
      as: 'audiences',
      onDelete: 'CASCADE'
    });
  };

  return Product;
};