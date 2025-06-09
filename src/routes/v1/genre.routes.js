const express = require('express');
const router = express.Router();
const genreController = require('../../controllers/v1/genre.controller');
const { body } = require('express-validator');
const { authenticate, authorize } = require('../../middlewares/auth');
const { validateRequest } = require('../../middlewares/validation.middleware');

router.get('/genres', genreController.listGenres);

router.post(
  '/genres',
  authenticate,
  authorize('admin'),
  body('name').isString().trim().notEmpty().withMessage('Name is required'),
  validateRequest,
  genreController.createGenre
);

router.get('/genres/:id/products', genreController.getProductsByGenreId);

module.exports = router; 