const analyticsService = require('../../services/v1/analytics.service');
const webSocketService = require('../../services/websocket.service');
const logger = require('../../utils/logger');

/**
 * @typedef {Object} NotificationResult
 * @property {boolean} success - Whether the notification was sent successfully
 * @property {string} [error] - Error message if notification failed
 */

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
   * @returns {Promise<NotificationResult>} Result of the notification
   */
  async notifyGenreDataUpdate() {
    try {
      const genreData = await analyticsService.getGenreDistribution();
      
      webSocketService.broadcastGenreUpdate({
        timestamp: new Date().toISOString(),
        genreDistribution: genreData
      });
      
      logger.debug('Broadcasted genre data update to connected clients');
      return { success: true };
    } catch (error) {
      logger.error('Error notifying genre data update:', error);
      return { success: false, error: error.message };
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

  /**
   * Get stock levels for products, optionally filtered by genre
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getStockLevelsByGenre(req, res, next) {
    try {
      const { genreId = '0' } = req.params;
      
      // Validate genreId if provided
      if (genreId !== '0' && isNaN(parseInt(genreId, 10))) {
        return res.status(400).json({
          success: false,
          error: 'Invalid genre ID'
        });
      }

      const stockData = await analyticsService.getStockLevelsByGenre(genreId);
      
      res.json({
        success: true,
        data: stockData
      });
    } catch (error) {
      logger.error('Error in getStockLevelsByGenre controller:', error);
      next(error);
    }
  }

  /**
   * Notify all connected clients about price analysis updates for a genre
   * @param {number} genreId - The ID of the genre to update
   * @returns {Promise<NotificationResult>} Result of the notification
   */
  async notifyPriceDataUpdate(genreId) {
    try {
      if (!genreId || isNaN(parseInt(genreId, 10))) {
        throw new Error('Valid genre ID is required');
      }

      const priceData = await analyticsService.getPriceAnalysisByGenre(parseInt(genreId, 10));
      
      webSocketService.broadcastPriceUpdate({
        timestamp: new Date().toISOString(),
        genreId: parseInt(genreId, 10),
        priceAnalysis: priceData
      });
      
      logger.debug(`Broadcasted price data update for genre ${genreId}`);
      return { success: true };
    } catch (error) {
      logger.error('Error notifying price data update:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Notify all connected clients about inventory updates
   * @param {string} [genreId='0'] - Optional genre ID to filter by
   * @returns {Promise<NotificationResult>} Result of the notification
   */
  async notifyInventoryUpdate(genreId = '0') {
    try {
      const stockData = await analyticsService.getStockLevelsByGenre(genreId);
      
      webSocketService.broadcastInventoryUpdate({
        timestamp: new Date().toISOString(),
        genreId: genreId === '0' ? null : parseInt(genreId, 10),
        stockLevels: stockData
      });
      
      logger.debug(`Broadcasted inventory update${genreId !== '0' ? ` for genre ${genreId}` : ''}`);
      return { success: true };
    } catch (error) {
      logger.error('Error notifying inventory update:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Notify about all analytics updates (genre, price, inventory)
   * @param {number} [genreId] - Optional genre ID for price updates
   * @returns {Promise<{
   *   genre: NotificationResult,
   *   price: NotificationResult,
   *   inventory: NotificationResult
   * }>} Results of all notifications
   */
  async notifyAllUpdates(genreId) {
    const [genreResult, priceResult, inventoryResult] = await Promise.all([
      this.notifyGenreDataUpdate(),
      genreId ? this.notifyPriceDataUpdate(genreId) : Promise.resolve({ success: true, skipped: true }),
      this.notifyInventoryUpdate(genreId || '0')
    ]);
    
    return { genre: genreResult, price: priceResult, inventory: inventoryResult };
  }
}

module.exports = new AnalyticsController();
