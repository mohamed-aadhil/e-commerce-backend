const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const Product = require('./Product');
const Genre = require('./Genre');

const BookGenre = sequelize.define('BookGenre', {
  book_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: Product,
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  genre_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: Genre,
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
}, {
  tableName: 'book_genres',
  timestamps: false,
});

BookGenre.belongsTo(Product, { foreignKey: 'book_id', onDelete: 'CASCADE' });
BookGenre.belongsTo(Genre, { foreignKey: 'genre_id', onDelete: 'CASCADE' });
Product.belongsToMany(Genre, { through: BookGenre, foreignKey: 'book_id', otherKey: 'genre_id' });
Genre.belongsToMany(Product, { through: BookGenre, foreignKey: 'genre_id', otherKey: 'book_id' });

module.exports = BookGenre; 