'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Step 1: Modify carts table
      await queryInterface.sequelize.query(`
        ALTER TABLE carts 
        ALTER COLUMN user_id DROP NOT NULL,
        ADD COLUMN session_id VARCHAR(255) UNIQUE,
        ADD COLUMN is_guest BOOLEAN NOT NULL DEFAULT TRUE,
        ADD CONSTRAINT user_id_unique_when_not_guest 
          CHECK (NOT (is_guest = false AND user_id IS NULL));
      `, { transaction });

      // Create partial indexes for carts
      await queryInterface.addIndex('carts', ['user_id'], {
        where: { is_guest: false },
        unique: true,
        transaction,
      });

      await queryInterface.addIndex('carts', ['session_id'], {
        where: { is_guest: true },
        unique: true,
        transaction,
      });

      // Step 2: Modify cart_items table
      await queryInterface.addColumn('cart_items', 'price', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
      }, { transaction });

      // Ensure timestamps exist (if they don't already)
      await queryInterface.addColumn('cart_items', 'created_at', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      }, { transaction });

      await queryInterface.addColumn('cart_items', 'updated_at', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      }, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Remove indexes first
      await queryInterface.removeIndex('carts', ['user_id'], { transaction });
      await queryInterface.removeIndex('carts', ['session_id'], { transaction });

      // Revert cart_items changes
      await queryInterface.removeColumn('cart_items', 'price', { transaction });
      
      // Revert carts table changes
      await queryInterface.sequelize.query(`
        ALTER TABLE carts 
        DROP CONSTRAINT user_id_unique_when_not_guest,
        ALTER COLUMN user_id SET NOT NULL,
        DROP COLUMN session_id,
        DROP COLUMN is_guest;
      `, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
