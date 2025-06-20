const { Op } = require('sequelize');
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
   * Get additional genre statistics
   * @returns {Promise<Object>} Object containing various genre statistics
   */
  async getGenreStats() {
    try {
      const [totalBooks, totalGenres, mostPopularGenre] = await Promise.all([
        db.Product.count({ 
          distinct: true,
          col: 'id'
        }),
        db.Genre.count(),
        db.Genre.findOne({
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
        })
      ]);

      return {
        totalBooks,
        totalGenres,
        mostPopularGenre: mostPopularGenre ? {
          id: mostPopularGenre.id,
          name: mostPopularGenre.name,
          bookCount: parseInt(mostPopularGenre.get('bookCount'), 10) || 0
        } : null
      };
    } catch (error) {
      logger.error('Error in getGenreStats:', error);
      throw error;
    }
  }
}

module.exports = new AnalyticsService();
