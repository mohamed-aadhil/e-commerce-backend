const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const productRoutes = require('./product.routes');
const inventoryRoutes = require('./inventory.routes');
const genreRoutes = require('./genre.routes');
const audienceRoutes = require('./audience.routes');
const cartRoutes = require('./cart.routes');
const testRoutes = require('./test.routes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/cart', cartRoutes);  // Mount cart routes at /api/v1/cart
router.use('/test', testRoutes);  // Mount test routes at /api/v1/test
router.use('/', productRoutes);
router.use('/', inventoryRoutes);
router.use('/', genreRoutes);
router.use('/', audienceRoutes);

module.exports = router;