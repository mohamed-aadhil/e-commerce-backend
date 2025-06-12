'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('used_books', {
      product_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: {
          model: 'products',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      condition: {
        type: Sequelize.TEXT,
        allowNull: false,
      }
    });

    await queryInterface.createTable('ebooks', {
      product_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: {
          model: 'products',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      file_format: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      download_url: {
        type: Sequelize.TEXT,
        allowNull: false,
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('used_books');
    await queryInterface.dropTable('ebooks');
  }
}; 