'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if the column already exists before adding
    const table = await queryInterface.describeTable('products');
    if (!table.images) {
      await queryInterface.addColumn('products', 'images', {
        type: Sequelize.JSONB,
        allowNull: true,
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the column only if it exists
    const table = await queryInterface.describeTable('products');
    if (table.images) {
      await queryInterface.removeColumn('products', 'images');
    }
  }
}; 