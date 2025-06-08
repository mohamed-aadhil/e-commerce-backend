const genreService = require('../../services/v1/genre.service');

exports.listGenres = async (req, res, next) => {
  try {
    const genres = await genreService.listGenres();
    res.json(genres);
  } catch (err) {
    next(err);
  }
}; 