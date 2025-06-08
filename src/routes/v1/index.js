const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
// Add other domain routes here as needed

router.use('/auth', authRoutes);

module.exports = router; 