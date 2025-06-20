const genreService = require('../../services/v1/genre.service');
const productService = require('../../services/v1/product.service');
const analyticsController = require('./analytics.controller');
const logger = require('../../utils/logger');

exports.listGenres = async (req, res, next) => {
  try {
    const genres = await genreService.listGenres();
    res.json(genres);
  } catch (err) {
    next(err);
  }
};

exports.createGenre = async (req, res, next) => {
  try {
    const genre = await genreService.createGenre(req.body);
    
    // Notify about genre data update
    try {
      await analyticsController.notifyGenreDataUpdate();
    } catch (wsError) {
      logger.error('Error notifying about genre update after genre creation:', wsError);
    }
    
    res.status(201).json(genre);
  } catch (err) {
    next(err);
  }
};

exports.updateGenre = async (req, res, next) => {
  try {
    const genre = await genreService.updateGenre(req.params.id, req.body);
    
    // Notify about genre data update
    try {
      await analyticsController.notifyGenreDataUpdate();
    } catch (wsError) {
      logger.error('Error notifying about genre update after genre update:', wsError);
    }
    
    res.json(genre);
  } catch (err) {
    next(err);
  }
};

exports.deleteGenre = async (req, res, next) => {
  try {
    await genreService.deleteGenre(req.params.id);
    
    // Notify about genre data update
    try {
      await analyticsController.notifyGenreDataUpdate();
    } catch (wsError) {
      logger.error('Error notifying about genre update after genre deletion:', wsError);
    }
    
    res.json({ success: true, message: 'Genre deleted successfully' });
  } catch (err) {
    next(err);
  }
};

exports.getProductsByGenreId = async (req, res, next) => {
  try {
    const products = await productService.getProductsByGenreId(req.params.id);
    res.json(products);
  } catch (err) {
    next(err);
  }
}; 