const { Genre } = require('../../models/product');

exports.listGenres = async () => {
  return Genre.findAll();
}; 