const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../../controllers/v1/auth.controller');
const { validateRequest } = require('../../middlewares/validation.middleware');

router.post(
  '/register',
  [
    body('name').isString().trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validateRequest,
  authController.register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validateRequest,
  authController.login
);

router.post(
  '/refresh',
  [
    body('refreshToken').optional().isString().notEmpty().withMessage('refreshToken must be a non-empty string if provided'),
  ],
  validateRequest,
  authController.refresh
);

router.post(
  '/logout',
  [
    body('refreshToken').optional().isString().notEmpty().withMessage('refreshToken must be a non-empty string if provided'),
  ],
  validateRequest,
  authController.logout
);

module.exports = router; 