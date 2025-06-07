const seedUsers = require('./userSeeder');
const seedProducts = require('./productSeeder');
const seedNewBooks = require('./newBookSeeder');

async function runSeeders() {
  try {
    await seedUsers();
    await seedProducts();
    await seedNewBooks();
    console.log('All seeds completed.');
    process.exit();
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

runSeeders(); 