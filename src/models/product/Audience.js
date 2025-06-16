module.exports = (sequelize, DataTypes) => {
  const Audience = sequelize.define('Audience', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    }
  }, {
    tableName: 'audiences',
    timestamps: false,
    underscored: true,
  });

  Audience.associate = (models) => {
    // Audience belongs to many Products (many-to-many through BookAudience)
    Audience.belongsToMany(models.Product, {
      through: models.BookAudience,
      foreignKey: 'audience_id',
      otherKey: 'book_id',
      as: 'books',
      onDelete: 'CASCADE'
    });
  };

  return Audience;
};