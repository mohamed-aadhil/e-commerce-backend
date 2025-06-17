const express = require('express');
const { body, param } = require('express-validator');
const userController = require('../../controllers/v1/user.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// User Profile Routes
router.get('/me', userController.getProfile);

router.put(
  '/me',
  [
    body('name').optional().trim().isLength({ min: 2, max: 100 }),
    body('email').optional().trim().isEmail().normalizeEmail(),
    validate
  ],
  userController.updateProfile
);

// Address Routes
router.get('/me/addresses', userController.getAddresses);

router.post(
  '/me/addresses',
  [
    body('recipientName').trim().notEmpty().withMessage('Recipient name is required'),
    body('addressLine1').trim().notEmpty().withMessage('Address line 1 is required'),
    body('city').trim().notEmpty().withMessage('City is required'),
    body('state').trim().notEmpty().withMessage('State is required'),
    body('postalCode').trim().notEmpty().withMessage('Postal code is required'),
    body('country').trim().notEmpty().withMessage('Country is required'),
    body('mobileNumber').trim().notEmpty().withMessage('Mobile number is required'),
    validate
  ],
  userController.addAddress
);

router.put(
  '/me/addresses/:id',
  [
    param('id').isInt().withMessage('Invalid address ID'),
    body('recipientName').optional().trim().notEmpty(),
    body('addressLine1').optional().trim().notEmpty(),
    body('addressLine2').optional().trim(),
    body('city').optional().trim().notEmpty(),
    body('state').optional().trim().notEmpty(),
    body('postalCode').optional().trim().notEmpty(),
    body('country').optional().trim().notEmpty(),
    body('mobileNumber').optional().trim().notEmpty(),
    validate
  ],
  userController.updateAddress
);

router.delete(
  '/me/addresses/:id',
  [
    param('id').isInt().withMessage('Invalid address ID'),
    validate
  ],
  userController.deleteAddress
);

module.exports = router;
