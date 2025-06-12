"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Add author column to products if it doesn't exist
    const table = await queryInterface.describeTable('products');
    if (!table.author) {
      await queryInterface.addColumn('products', 'author', {
        type: Sequelize.TEXT,
        allowNull: true, // Set to false after migration
      });
    }

    // 2. Copy author from new_books
    await queryInterface.sequelize.query(`
      UPDATE products
      SET author = nb.author
      FROM new_books nb
      WHERE products.id = nb.product_id
    `);

    // 3. Set author as NOT NULL
    await queryInterface.changeColumn('products', 'author', {
      type: Sequelize.TEXT,
      allowNull: false,
    });

    // 4. Add unique constraint if it doesn't exist
    const constraints = await queryInterface.showConstraint('products');
    const hasConstraint = constraints.some(c => c.constraintName === 'unique_product_type_title_author');
    if (!hasConstraint) {
      await queryInterface.addConstraint('products', {
        fields: ['product_type', 'title', 'author'],
        type: 'unique',
        name: 'unique_product_type_title_author',
      });
    }

    // 5. Remove author from new_books if it exists
    const newBooksTable = await queryInterface.describeTable('new_books');
    if (newBooksTable.author) {
      await queryInterface.removeColumn('new_books', 'author');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // 1. Add author back to new_books if not exist
    const newBooksTable = await queryInterface.describeTable('new_books');
    if (!newBooksTable.author) {
      await queryInterface.addColumn('new_books', 'author', { type: Sequelize.TEXT, allowNull: false });
    }

    // 2. Remove unique constraint if exists
    const constraints = await queryInterface.showConstraint('products');
    const hasConstraint = constraints.some(c => c.constraintName === 'unique_product_type_title_author');
    if (hasConstraint) {
      await queryInterface.removeConstraint('products', 'unique_product_type_title_author');
    }

    // 3. Remove author from products if exists
    const table = await queryInterface.describeTable('products');
    if (table.author) {
      await queryInterface.removeColumn('products', 'author');
    }
  }
}; 