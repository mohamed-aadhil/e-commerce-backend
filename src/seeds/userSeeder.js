const User = require('../models/user/User');
const sequelize = require('../config/database');

async function seedUsers() {
  await sequelize.sync();
  await User.bulkCreate([
    {
      name: 'Alice Smith',
      email: 'alice@example.com',
      password_hash: 'hashedpassword1',
      role: 'customer',
    },
    {
      name: 'Bob Johnson',
      email: 'bob@example.com',
      password_hash: 'hashedpassword2',
      role: 'admin',
    },
    {
      name: 'Charlie Brown',
      email: 'charlie@example.com',
      password_hash: 'hashedpassword3',
      role: 'customer',
    },
  ], { ignoreDuplicates: true });
  console.log('User seed completed.');
}

module.exports = seedUsers; 