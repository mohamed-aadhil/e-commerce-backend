const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const productRoutes = require('./product.routes');
const inventoryRoutes = require('./inventory.routes');
const genreRoutes = require('./genre.routes');
const audienceRoutes = require('./audience.routes');
const cartRoutes = require('./cart.routes');
const userRoutes = require('./user.routes');
const orderRoutes = require('./order.routes');
const paymentRoutes = require('./payment.routes');
const testRoutes = require('./test.routes');
const analyticsRoutes = require('./analytics.routes');

// Mount routes with specific paths first
router.use('/auth', authRoutes);
router.use('/cart', cartRoutes);     // Mount cart routes at /api/v1/cart
router.use('/users', userRoutes);    // Mount user routes at /api/v1/users
router.use('/orders', orderRoutes);  // Mount order routes at /api/v1/orders
router.use('/payments', paymentRoutes); // Mount payment routes at /api/v1/payments
router.use('/analytics', analyticsRoutes); // Mount analytics routes at /api/v1/analytics
router.use('/test', testRoutes);     // Mount test routes at /api/v1/test

// Mount other routes with more specific paths first to avoid conflicts
router.use('/', inventoryRoutes);
router.use('/', genreRoutes);
router.use('/', audienceRoutes);

// Mount product routes last with catch-all route
router.use('/', productRoutes);

module.exports = router;