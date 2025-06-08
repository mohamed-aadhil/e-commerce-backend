const { Audience } = require('../../models/product');

exports.listAudiences = async () => {
  return Audience.findAll();
}; 