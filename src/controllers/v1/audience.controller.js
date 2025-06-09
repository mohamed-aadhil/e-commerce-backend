const audienceService = require('../../services/v1/audience.service');
const productService = require('../../services/v1/product.service');

exports.listAudiences = async (req, res, next) => {
  try {
    const audiences = await audienceService.listAudiences();
    res.json(audiences);
  } catch (err) {
    next(err);
  }
};

exports.createAudience = async (req, res, next) => {
  try {
    const audience = await audienceService.createAudience(req.body);
    res.status(201).json(audience);
  } catch (err) {
    next(err);
  }
};

exports.getProductsByAudienceId = async (req, res, next) => {
  try {
    const products = await productService.getProductsByAudienceId(req.params.id);
    res.json(products);
  } catch (err) {
    next(err);
  }
}; 