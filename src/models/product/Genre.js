module.exports = (sequelize, DataTypes) => {
  const Genre = sequelize.define('Genre', {
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
    tableName: 'genres',
    timestamps: false,
    underscored: true,
  });

  Genre.associate = (models) => {
    // Genre belongs to many Products (many-to-many through BookGenre)
    Genre.belongsToMany(models.Product, {
      through: models.BookGenre,
      foreignKey: 'genre_id',
      otherKey: 'book_id',
      as: 'books',
      onDelete: 'CASCADE'
    });
  };

  return Genre;
};