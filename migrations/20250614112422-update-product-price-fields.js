'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // 1. Add new columns
      await queryInterface.addColumn('products', 'selling_price', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      }, { transaction });

      await queryInterface.addColumn('products', 'cost_price', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      }, { transaction });

      await queryInterface.addColumn('products', 'description', {
        type: Sequelize.TEXT,
        allowNull: true
      }, { transaction });

      // 2. Migrate existing price to both selling_price and cost_price
      await queryInterface.sequelize.query(
        'UPDATE products SET selling_price = price, cost_price = price * 0.7 WHERE price IS NOT NULL',
        { transaction }
      );

      // 3. Drop the old price column
      await queryInterface.removeColumn('products', 'price', { transaction });

      // 4. Add check constraint to ensure selling_price >= cost_price
      await queryInterface.addConstraint('products', {
        fields: ['selling_price', 'cost_price'],
        type: 'check',
        name: 'selling_price_gte_cost_price',
        where: {
          [Sequelize.Op.and]: [
            queryInterface.sequelize.literal('selling_price >= cost_price')
          ]
        },
        transaction
      });

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
      // 1. Re-add the price column
      await queryInterface.addColumn('products', 'price', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      }, { transaction });

      // 2. Migrate selling_price back to price
      await queryInterface.sequelize.query(
        'UPDATE products SET price = selling_price',
        { transaction }
      );

      // 3. Remove constraints and new columns
      await queryInterface.removeConstraint('products', 'selling_price_gte_cost_price', { transaction });
      await queryInterface.removeColumn('products', 'selling_price', { transaction });
      await queryInterface.removeColumn('products', 'cost_price', { transaction });
      await queryInterface.removeColumn('products', 'description', { transaction });

      await transaction.commit();
      console.log('Migration rolled back successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('Rollback failed:', error);
      throw error;
    }
  }
};
