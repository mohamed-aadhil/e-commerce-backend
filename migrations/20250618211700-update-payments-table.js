'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // 1. Check if payments table exists
      const [tableExists] = await queryInterface.sequelize.query(
        "SELECT to_regclass('payments') as exists"
      );
      
      if (!tableExists[0].exists) {
        console.log('Payments table does not exist, creating it...');
        await queryInterface.createTable('payments', {
          id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
          },
          order_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'orders',
              key: 'id'
            },
            onDelete: 'CASCADE'
          },
          payment_method: {
            type: Sequelize.STRING,
            allowNull: false
          },
          payment_status: {
            type: Sequelize.ENUM('pending', 'completed', 'failed'),
            allowNull: false,
            defaultValue: 'pending'
          },
          transaction_id: {
            type: Sequelize.STRING,
            allowNull: true
          },
          amount: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: false
          },
          paid_at: {
            type: Sequelize.DATE,
            allowNull: true
          },
          refunded_at: {
            type: Sequelize.DATE,
            allowNull: true
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          }
        }, { transaction });
        
        // Create indexes
        await queryInterface.addIndex('payments', ['order_id'], { transaction });
        await queryInterface.addIndex('payments', ['payment_status'], { transaction });
        await queryInterface.addIndex('payments', ['transaction_id'], {
          unique: true,
          transaction
        });
        
        await transaction.commit();
        return;
      }

      // 2. Handle existing table
      
      // Check and handle status/payment_status column
      const [statusColumn] = await queryInterface.sequelize.query(
        `SELECT column_name 
         FROM information_schema.columns 
         WHERE table_name = 'payments' 
         AND column_name IN ('status', 'payment_status')`
      );
      
      const hasStatus = statusColumn.some(col => col.column_name === 'status');
      const hasPaymentStatus = statusColumn.some(col => col.column_name === 'payment_status');
      
      if (hasStatus && !hasPaymentStatus) {
        // Rename status to payment_status
        try {
          await queryInterface.sequelize.query(
            'ALTER TABLE payments RENAME COLUMN status TO payment_status',
            { transaction }
          );
        } catch (error) {
          console.log('Error renaming status column:', error.message);
        }
      } else if (!hasStatus && !hasPaymentStatus) {
        // Add payment_status column
        await queryInterface.addColumn('payments', 'payment_status', {
          type: Sequelize.ENUM('pending', 'completed', 'failed'),
          allowNull: false,
          defaultValue: 'pending',
          comment: 'Current status of the payment'
        }, { transaction });
      }
      
      // 3. Add missing columns if they don't exist
      const columnsToAdd = [
        {
          name: 'refunded_at',
          options: {
            type: Sequelize.DATE,
            allowNull: true,
            comment: 'When the payment was refunded, if applicable'
          }
        },
        {
          name: 'created_at',
          options: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          }
        },
        {
          name: 'updated_at',
          options: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          }
        }
      ];
      
      for (const { name, options } of columnsToAdd) {
        const [columnExists] = await queryInterface.sequelize.query(
          `SELECT column_name 
           FROM information_schema.columns 
           WHERE table_name = 'payments' 
           AND column_name = '${name}'`
        );
        
        if (columnExists.length === 0) {
          await queryInterface.addColumn('payments', name, options, { transaction });
        }
      }
      
      // 4. Update column types and constraints
      const columnUpdates = [
        {
          name: 'payment_status',
          options: {
            type: Sequelize.ENUM('pending', 'completed', 'failed'),
            allowNull: false,
            defaultValue: 'pending',
            comment: 'Current status of the payment'
          }
        },
        {
          name: 'transaction_id',
          options: {
            type: Sequelize.STRING,
            allowNull: true,
            comment: 'Transaction ID from payment gateway'
          }
        },
        {
          name: 'amount',
          options: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: false,
            comment: 'Payment amount'
          }
        }
      ];
      
      for (const { name, options } of columnUpdates) {
        try {
          await queryInterface.changeColumn('payments', name, options, { transaction });
        } catch (error) {
          console.log(`Error updating column ${name}:`, error.message);
        }
      }
      
      // 5. Create indexes if they don't exist
      const indexes = [
        { fields: ['order_id'] },
        { fields: ['payment_status'] },
        { 
          fields: ['transaction_id'],
          options: { unique: true }
        }
      ];
      
      for (const { fields, options = {} } of indexes) {
        try {
          await queryInterface.addIndex('payments', fields, { ...options, transaction });
        } catch (error) {
          console.log(`Index on ${fields.join(', ')} already exists or error:`, error.message);
        }
      }
      
      // 6. Add foreign key constraint if it doesn't exist
      const [constraintExists] = await queryInterface.sequelize.query(
        `SELECT conname 
         FROM pg_constraint 
         WHERE conname = 'payments_order_id_fkey'`
      );
      
      if (constraintExists.length === 0) {
        await queryInterface.addConstraint('payments', {
          fields: ['order_id'],
          type: 'foreign key',
          name: 'payments_order_id_fkey',
          references: {
            table: 'orders',
            field: 'id'
          },
          onDelete: 'CASCADE',
          transaction
        });
      }
      
      await transaction.commit();
      console.log('Payments table migration completed successfully');
    } catch (error) {
      console.error('Error in payments table migration:', error);
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Note: This is a minimal rollback. In production, you should have a full backup.
    console.warn('Rolling back payments table changes. This is a minimal rollback.');
    
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Drop the table if it was created by this migration
      // Note: This is destructive and should be used with caution
      await queryInterface.dropTable('payments', { transaction });
      
      // Drop the enum type if it exists
      try {
        await queryInterface.sequelize.query(
          'DROP TYPE IF EXISTS enum_payments_payment_status',
          { transaction }
        );
      } catch (error) {
        console.log('Error dropping enum type:', error.message);
      }
      
      await transaction.commit();
    } catch (error) {
      console.error('Error during rollback:', error);
      await transaction.rollback();
      throw error;
    }
  }
};
