const genreService = require('../../services/v1/genre.service');
const productService = require('../../services/v1/product.service');

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
    res.status(201).json(genre);
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