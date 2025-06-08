const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const productRoutes = require('./product.routes');
const inventoryRoutes = require('./inventory.routes');
const genreRoutes = require('./genre.routes');
const audienceRoutes = require('./audience.routes');
// Add other domain routes here as needed

router.use('/auth', authRoutes);
router.use('/', productRoutes);
router.use('/', inventoryRoutes);
router.use('/', genreRoutes);
router.use('/', audienceRoutes);

module.exports = router; 