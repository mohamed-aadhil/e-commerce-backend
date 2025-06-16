const { sequelize } = require('./src/models/product/Product');
const { exec } = require('child_process');

console.log('Running database migrations...');

// Run the migration
exec('npx sequelize-cli db:migrate', (error, stdout, stderr) => {
  if (error) {
    console.error('Error running migration:', error);
    console.error('stderr:', stderr);
    process.exit(1);
  }
  console.log('Migration output:', stdout);
  console.log('Migration completed successfully!');
  process.exit(0);
});
