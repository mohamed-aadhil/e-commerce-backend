const { Op, literal } = require('sequelize');
const db = require('../../models');
const logger = require('../../utils/logger');

class AnalyticsService {
  /**
   * Get book count by genre
   * @returns {Promise<Array>} Array of objects with genre name and book count
   */
  async getGenreDistribution() {
    try {
      const genres = await db.Genre.findAll({
        attributes: [
          'id',
          'name',
          [db.sequelize.fn('COUNT', db.sequelize.col('books.id')), 'bookCount']
        ],
        include: [
          {
            model: db.Product,
            as: 'books',
            attributes: [],
            through: { attributes: [] },
            required: false
          }
        ],
        group: ['Genre.id'],
        order: [[db.sequelize.literal('"bookCount"'), 'DESC']],
        subQuery: false
      });

      return genres.map(genre => ({
        id: genre.id,
        name: genre.name,
        bookCount: parseInt(genre.get('bookCount'), 10) || 0
      }));
    } catch (error) {
      logger.error('Error in getGenreDistribution:', error);
      throw error;
    }
  }


  /**
   * Get price analysis for products in a specific genre
   * @param {number} genreId - The ID of the genre to analyze
   * @returns {Promise<Object>} Object containing products with price analysis and statistics
   */
  async getPriceAnalysisByGenre(genreId) {
    try {
      // Get all products in the specified genre with their prices
      const products = await db.Product.findAll({
        attributes: [
          'id',
          'title',
          'cost_price',
          'selling_price',
          [
            literal('(selling_price - cost_price) / cost_price * 100'), 
            'profit_margin'
          ]
        ],
        include: [{
          model: db.Genre,
          as: 'genres',
          where: { id: genreId },
          attributes: [],
          through: { attributes: [] },
          required: true
        }],
        order: [['title', 'ASC']],
        raw: true
      });

      // Calculate statistics
      const stats = await db.Product.findAll({
        attributes: [
          [literal('AVG(cost_price)'), 'avgCostPrice'],
          [literal('AVG(selling_price)'), 'avgSellingPrice'],
          [
            literal('AVG((selling_price - cost_price) / cost_price * 100)'), 
            'avgProfitMargin'
          ],
          [literal('COUNT(*)'), 'totalProducts']
        ],
        include: [{
          model: db.Genre,
          as: 'genres',
          where: { id: genreId },
          attributes: [],
          through: { attributes: [] },
          required: true
        }],
        raw: true
      });

      // Format the response
      return {
        products: products.map(p => ({
          id: p.id,
          title: p.title,
          costPrice: parseFloat(p.cost_price),
          sellingPrice: parseFloat(p.selling_price),
          profitMargin: parseFloat(p.profit_margin) || 0
        })),
        stats: {
          avgCostPrice: parseFloat(stats[0]?.avgCostPrice) || 0,
          avgSellingPrice: parseFloat(stats[0]?.avgSellingPrice) || 0,
          avgProfitMargin: parseFloat(stats[0]?.avgProfitMargin) || 0,
          totalProducts: parseInt(stats[0]?.totalProducts, 10) || 0
        }
      };
    } catch (error) {
      logger.error('Error in getPriceAnalysisByGenre:', error);
      throw error;
    }
  }
}

module.exports = new AnalyticsService();
