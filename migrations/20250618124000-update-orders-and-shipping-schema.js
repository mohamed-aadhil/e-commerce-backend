'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // 1. Add new columns to orders table
      await queryInterface.addColumn('orders', 'payment_status', {
        type: Sequelize.ENUM('pending', 'completed', 'failed'),
        allowNull: false,
        defaultValue: 'pending'
      }, { transaction });

      await queryInterface.addColumn('orders', 'shipping_address_id', {
        type: Sequelize.INTEGER,
        references: {
          model: 'addresses',
          key: 'id'
        },
        allowNull: true, // Allow null for backward compatibility
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      }, { transaction });

      await queryInterface.addColumn('orders', 'shipping_method', {
        type: Sequelize.STRING(50),
        allowNull: true // Allow null for backward compatibility
      }, { transaction });

      await queryInterface.addColumn('orders', 'shipping_cost', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      }, { transaction });

      await queryInterface.addColumn('orders', 'payment_id', {
        type: Sequelize.INTEGER,
        references: {
          model: 'payments',
          key: 'id'
        },
        allowNull: true, // Allow null initially
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      }, { transaction });

      // 2. Update orders status constraint
      await queryInterface.sequelize.query(
        `ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check`,
        { transaction }
      );

      await queryInterface.sequelize.query(
        `ALTER TABLE orders ADD CONSTRAINT orders_status_check 
         CHECK (status IN (
           'pending', 
           'paid', 
           'shipped', 
           'delivered', 
           'cancelled'
         ))`,
        { transaction }
      );

      // 3. Add shipping_cost to shipping table
      await queryInterface.addColumn('shipping', 'shipping_cost', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      }, { transaction });

      // 4. Ensure shipping_status constraint exists
      await queryInterface.sequelize.query(
        `ALTER TABLE shipping DROP CONSTRAINT IF EXISTS shipping_status_check`,
        { transaction }
      );

      await queryInterface.sequelize.query(
        `ALTER TABLE shipping ADD CONSTRAINT shipping_status_check 
         CHECK (shipping_status IN (
           'pending', 
           'shipped', 
           'delivered', 
           'cancelled'
         ))`,
        { transaction }
      );

      await transaction.commit();
      console.log('Migration completed successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // 1. Drop columns from orders table
      await queryInterface.removeColumn('orders', 'payment_status', { transaction });
      await queryInterface.removeColumn('orders', 'shipping_address_id', { transaction });
      await queryInterface.removeColumn('orders', 'shipping_method', { transaction });
      await queryInterface.removeColumn('orders', 'shipping_cost', { transaction });
      
      // Remove payment_id foreign key first
      const orderTable = await queryInterface.describeTable('orders');
      if (orderTable.payment_id) {
        await queryInterface.removeConstraint('orders', 'orders_payment_id_fkey', { transaction });
        await queryInterface.removeColumn('orders', 'payment_id', { transaction });
      }

      // Restore original status constraint
      await queryInterface.sequelize.query(
        `ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check`,
        { transaction }
      );

      // No need to add back the constraint as it will be handled by the original migration
      // The down migration should just remove the columns we added

      // 2. Remove shipping_cost from shipping table
      await queryInterface.removeColumn('shipping', 'shipping_cost', { transaction });

      // Restore original shipping_status constraint
      await queryInterface.sequelize.query(
        `ALTER TABLE shipping DROP CONSTRAINT IF EXISTS shipping_status_check`,
        { transaction }
      );

      await transaction.commit();
      console.log('Migration rolled back successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('Rollback failed:', error);
      throw error;
    }
  }
};
