const express = require('express');
const app = express();
const dotenv = require('dotenv');
const sequelize = require('./config/database');
const { User } = require('./models/product');
dotenv.config();

app.use(express.json());

// TODO: Add routes here

sequelize.sync()
  .then(() => {
    console.log('Database & tables synced!');
  })
  .catch((err) => {
    console.error('Error syncing database:', err);
  });

app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({ status: 'ok', db: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', db: 'disconnected', error: error.message });
  }
});

module.exports = app; 