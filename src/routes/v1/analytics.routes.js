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

// Get price analysis by genre
router.get(
  '/price-analysis/:genreId',
  authenticate,
  authorize(['admin']),
  analyticsController.getPriceAnalysisByGenre
);

// Get stock levels by genre (0 for all genres)
router.get(
  '/stock-levels/:genreId?',
  authenticate,
  authorize(['admin']),
  analyticsController.getStockLevelsByGenre
);

module.exports = router;
