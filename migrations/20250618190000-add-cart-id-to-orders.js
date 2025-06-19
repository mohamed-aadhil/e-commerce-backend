'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Add cart_id column to orders table
      await queryInterface.addColumn(
        'orders',
        'cart_id',
        {
          type: Sequelize.INTEGER,
          allowNull: true, // Allow null for backward compatibility
          references: {
            model: 'carts',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        { transaction }
      );

      // Add index for better query performance
      await queryInterface.addIndex('orders', ['cart_id'], {
        name: 'orders_cart_id_idx',
        transaction,
      });

      await transaction.commit();
      console.log('Migration completed: Added cart_id to orders table');
    } catch (error) {
      await transaction.rollback();
      console.error('Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Remove the index first
      await queryInterface.removeIndex('orders', 'orders_cart_id_idx', { transaction });
      
      // Then remove the column
      await queryInterface.removeColumn('orders', 'cart_id', { transaction });
      
      await transaction.commit();
      console.log('Migration rolled back: Removed cart_id from orders table');
    } catch (error) {
      await transaction.rollback();
      console.error('Rollback failed:', error);
      throw error;
    }
  }
};
