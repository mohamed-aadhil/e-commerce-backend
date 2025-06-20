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
   * Get genre statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getGenreStats(req, res, next) {
    try {
      const stats = await analyticsService.getGenreStats();
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error in getGenreStats controller:', error);
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
      const stats = await analyticsService.getGenreStats();
      
      // Broadcast to all connected clients in the analytics room
      webSocketService.broadcastGenreUpdate({
        timestamp: new Date().toISOString(),
        genreDistribution: genreData,
        stats: stats
      });
      
      logger.info('Broadcasted genre data update to connected clients');
    } catch (error) {
      logger.error('Error notifying genre data update:', error);
    }
  }
}

module.exports = new AnalyticsController();
