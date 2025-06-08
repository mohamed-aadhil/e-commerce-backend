const audienceService = require('../../services/v1/audience.service');

exports.listAudiences = async (req, res, next) => {
  try {
    const audiences = await audienceService.listAudiences();
    res.json(audiences);
  } catch (err) {
    next(err);
  }
}; 