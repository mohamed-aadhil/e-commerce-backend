const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const productRoutes = require('./product.routes');
// Add other domain routes here as needed

router.use('/auth', authRoutes);
router.use('/', productRoutes);

module.exports = router; 