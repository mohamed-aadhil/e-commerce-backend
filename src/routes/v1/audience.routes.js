const express = require('express');
const router = express.Router();
const audienceController = require('../../controllers/v1/audience.controller');
const { body } = require('express-validator');
const { authenticate, authorize } = require('../../middlewares/auth');
const { validateRequest } = require('../../middlewares/validation.middleware');

router.get('/audiences', audienceController.listAudiences);

router.post(
  '/audiences',
  authenticate,
  authorize('admin'),
  body('name').isString().trim().notEmpty().withMessage('Name is required'),
  validateRequest,
  audienceController.createAudience
);

router.get('/audiences/:id/products', audienceController.getProductsByAudienceId);

module.exports = router; 