'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('book_audiences', {
      book_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: {
          model: 'products',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      audience_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: {
          model: 'audiences',
          key: 'id',
        },
        onDelete: 'CASCADE',
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('book_audiences');
  }
}; 