const express = require('express');
const router = express.Router();
const analyticsController = require('../../controllers/v1/analytics.controller');
const { authenticate, authorize } = require('../../middlewares/auth');

// Get genre distribution data
router.get(
  '/genre-distribution',
  authenticate,
  authorize(['admin']),
  analyticsController.getGenreDistribution
);

// Get genre statistics
router.get(
  '/genre-stats',
  authenticate,
  authorize(['admin']),
  analyticsController.getGenreStats
);

module.exports = router;
