const { Genre } = require('../../models/product');

exports.listGenres = async () => {
  return Genre.findAll();
};

exports.createGenre = async (data) => {
  return Genre.create({ name: data.name });
}; 