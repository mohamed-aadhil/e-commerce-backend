const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const productRoutes = require('./product.routes');
const inventoryRoutes = require('./inventory.routes');
// Add other domain routes here as needed

router.use('/auth', authRoutes);
router.use('/', productRoutes);
router.use('/', inventoryRoutes);

module.exports = router; 