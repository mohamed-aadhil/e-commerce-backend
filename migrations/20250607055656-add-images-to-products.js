'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    const table = await queryInterface.describeTable('products');
    if (!table.images) {
      await queryInterface.addColumn('products', 'images', {
        type: Sequelize.JSONB,
        allowNull: true,
      });
    }
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    const table = await queryInterface.describeTable('products');
    if (table.images) {
      await queryInterface.removeColumn('products', 'images');
    }
  }
};
