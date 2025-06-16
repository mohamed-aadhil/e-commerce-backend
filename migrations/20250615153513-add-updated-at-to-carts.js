'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Add updated_at column to carts table if it doesn't exist
      const tableInfo = await queryInterface.describeTable('carts');
      
      if (!tableInfo.updated_at) {
        await queryInterface.addColumn('carts', 'updated_at', {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        }, { transaction });

        // Add a trigger to update the updated_at timestamp on row update
        await queryInterface.sequelize.query(
          `CREATE OR REPLACE FUNCTION update_updated_at_column()
           RETURNS TRIGGER AS $$
           BEGIN
              NEW.updated_at = CURRENT_TIMESTAMP;
              RETURN NEW;
           END;
           $$ language 'plpgsql';`,
          { transaction }
        );

        await queryInterface.sequelize.query(
          `CREATE TRIGGER update_carts_updated_at
           BEFORE UPDATE ON carts
           FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`,
          { transaction }
        );
      }
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Remove the trigger first
      await queryInterface.sequelize.query(
        'DROP TRIGGER IF EXISTS update_carts_updated_at ON carts;',
        { transaction }
      );
      
      // Remove the function
      await queryInterface.sequelize.query(
        'DROP FUNCTION IF EXISTS update_updated_at_column();',
        { transaction }
      );
      
      // Remove the column if it exists
      const tableInfo = await queryInterface.describeTable('carts');
      if (tableInfo.updated_at) {
        await queryInterface.removeColumn('carts', 'updated_at', { transaction });
      }
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
