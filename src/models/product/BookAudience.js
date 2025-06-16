const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const BookAudience = sequelize.define('BookAudience', {
    book_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'products',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    audience_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'audiences',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
  }, {
    tableName: 'book_audiences',
    timestamps: false,
  });

  BookAudience.associate = (models) => {
    BookAudience.belongsTo(models.Product, {
      foreignKey: 'book_id',
      as: 'book',
      onDelete: 'CASCADE'
    });
    
    BookAudience.belongsTo(models.Audience, {
      foreignKey: 'audience_id',
      as: 'audience',
      onDelete: 'CASCADE'
    });
  };

  return BookAudience;
};