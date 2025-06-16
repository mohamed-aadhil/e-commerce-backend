'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Drop the existing new_books table
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS new_books CASCADE');
    
    // Recreate the new_books table with the correct schema
    await queryInterface.createTable('new_books', {
      product_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: {
          model: 'products',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('new_books');
  }
};
