const db = require('../../models');
const { Audience } = db;

exports.listAudiences = async () => {
  return Audience.findAll();
};

exports.createAudience = async (data) => {
  // Check if audience with the same name already exists
  const existingAudience = await Audience.findOne({ where: { name: data.name } });
  if (existingAudience) {
    const error = new Error(`Audience "${data.name}" already exists`);
    error.status = 400;
    throw error;
  }
  return Audience.create({ name: data.name });
};
