const analyticsService = require('../../services/v1/analytics.service');
const webSocketService = require('../../services/websocket.service');
const logger = require('../../utils/logger');

class AnalyticsController {
  /**
   * Get genre distribution data
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getGenreDistribution(req, res, next) {
    try {
      const genreData = await analyticsService.getGenreDistribution();
      res.json({
        success: true,
        data: genreData
      });
    } catch (error) {
      logger.error('Error in getGenreDistribution controller:', error);
      next(error);
    }
  }

  /**
   * Notify all connected clients about genre data updates
   * This will be called from other controllers when relevant data changes
   */
  async notifyGenreDataUpdate() {
    try {
      const genreData = await analyticsService.getGenreDistribution();
      
      // Broadcast to all connected clients in the analytics room
      webSocketService.broadcastGenreUpdate({
        timestamp: new Date().toISOString(),
        genreDistribution: genreData
      });
      
      logger.info('Broadcasted genre data update to connected clients');
    } catch (error) {
      logger.error('Error notifying genre data update:', error);
    }
  }

  /**
   * Get price analysis for products in a specific genre
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getPriceAnalysisByGenre(req, res, next) {
    try {
      const { genreId } = req.params;
      
      if (!genreId || isNaN(parseInt(genreId, 10))) {
        return res.status(400).json({
          success: false,
          error: 'Valid genre ID is required'
        });
      }

      const priceAnalysis = await analyticsService.getPriceAnalysisByGenre(parseInt(genreId, 10));
      
      res.json({
        success: true,
        data: priceAnalysis
      });
    } catch (error) {
      logger.error('Error in getPriceAnalysisByGenre controller:', error);
      next(error);
    }
  }
}

module.exports = new AnalyticsController();
