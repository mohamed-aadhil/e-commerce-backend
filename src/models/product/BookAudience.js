const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const Product = require('./Product');
const Audience = require('./Audience');

const BookAudience = sequelize.define('BookAudience', {
  book_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: Product,
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  audience_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: Audience,
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
}, {
  tableName: 'book_audiences',
  timestamps: false,
});

// Associations (optional, but recommended for Sequelize)
BookAudience.belongsTo(Product, { foreignKey: 'book_id', onDelete: 'CASCADE' });
BookAudience.belongsTo(Audience, { foreignKey: 'audience_id', onDelete: 'CASCADE' });
Product.belongsToMany(Audience, { through: BookAudience, foreignKey: 'book_id', otherKey: 'audience_id' });
Audience.belongsToMany(Product, { through: BookAudience, foreignKey: 'audience_id', otherKey: 'book_id' });

module.exports = BookAudience; 