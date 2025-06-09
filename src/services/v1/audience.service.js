const { Audience } = require('../../models/product');

exports.listAudiences = async () => {
  return Audience.findAll();
};

exports.createAudience = async (data) => {
  return Audience.create({ name: data.name });
}; 