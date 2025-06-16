const db = require('../../models');
const { Genre } = db;

exports.listGenres = async () => {
  return Genre.findAll();
};

exports.createGenre = async (data) => {
  const existingGenre = await Genre.findOne({ where: { name: data.name } });
  if (existingGenre) {
    const error = new Error(`Genre "${data.name}" already exists`);
    error.status = 400;
    throw error;
  }
  return Genre.create({ name: data.name });
};