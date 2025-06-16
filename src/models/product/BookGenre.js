const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const Product = require('./Product');
const Genre = require('./Genre');

module.exports = (sequelize, DataTypes) => {
  const BookGenre = sequelize.define('BookGenre', {
    book_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'products',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    genre_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'genres',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
  }, {
    tableName: 'book_genres',
    timestamps: false,
  });

  BookGenre.associate = (models) => {
    BookGenre.belongsTo(models.Product, {
      foreignKey: 'book_id',
      as: 'book',
      onDelete: 'CASCADE'
    });
    
    BookGenre.belongsTo(models.Genre, {
      foreignKey: 'genre_id',
      as: 'genre',
      onDelete: 'CASCADE'
    });
  };

  return BookGenre;
};