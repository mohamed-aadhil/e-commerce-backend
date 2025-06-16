const { body } = require('express-validator');

const createProductValidation = [
  body('title')
    .isString().withMessage('Title must be a string')
    .notEmpty().withMessage('Title is required'),
  body('selling_price')
    .isFloat({ gt: 0 }).withMessage('Selling price must be a positive number'),
  body('cost_price')
    .isFloat({ gt: 0 }).withMessage('Cost price must be a positive number')
    .custom((value, { req }) => {
      if (parseFloat(req.body.selling_price) < parseFloat(value)) {
        throw new Error('Selling price must be greater than or equal to cost price');
      }
      return true;
    }),
  body('description')
    .optional()
    .isString().withMessage('Description must be a string'),
  body('product_type')
    .isIn(['New Book']).withMessage('Only "New Book" is supported at this time'),
  body('metadata')
    .optional()
    .isObject().withMessage('Metadata must be an object'),
  body('images')
    .optional()
    .isArray().withMessage('Images must be an array of URLs')
    .custom((arr) => arr.every(img => typeof img === 'string' && img.trim() !== '')).withMessage('Each image must be a non-empty string'),
  body('images.*')
    .optional()
    .isURL().withMessage('Each image must be a valid URL'),
  body('author')
    .isString().withMessage('Author is required for new books'),
  body('condition')
    .if(body('product_type').equals('Used book'))
    .isString().withMessage('Condition is required for used books'),
  body('file_format')
    .if(body('product_type').equals('ebook'))
    .isString().withMessage('File format is required for ebooks'),
  body('download_url')
    .if(body('product_type').equals('ebook'))
    .isString().withMessage('Download URL is required for ebooks'),
  body('genre_ids')
    .isArray({ min: 1 }).withMessage('At least one genre is required'),
  body('audience_ids')
    .isArray({ min: 1 }).withMessage('At least one audience is required'),
  body('initial_stock')
    .isInt({ min: 0 }).withMessage('Initial stock must be a non-negative integer'),
];

const updateProductValidation = [
  body('product_type')
    .optional()
    .isIn(['New Book']).withMessage('Only "New Book" is supported at this time'),
  body('title')
    .optional()
    .isString().withMessage('Title must be a string'),
  body('selling_price')
    .optional()
    .isFloat({ gt: 0 }).withMessage('Selling price must be a positive number'),
  body('cost_price')
    .optional()
    .isFloat({ gt: 0 }).withMessage('Cost price must be a positive number')
    .custom((value, { req }) => {
      const sellingPrice = req.body.selling_price || req.product?.selling_price;
      if (sellingPrice && parseFloat(sellingPrice) < parseFloat(value)) {
        throw new Error('Selling price must be greater than or equal to cost price');
      }
      return true;
    }),
  body('description')
    .optional()
    .isString().withMessage('Description must be a string'),
  body('metadata')
    .optional()
    .isObject().withMessage('Metadata must be an object'),
  body('images')
    .optional()
    .isArray().withMessage('Images must be an array')
    .custom((arr) => arr.every(img => typeof img === 'string' && img.trim() !== '')).withMessage('Each image must be a non-empty string'),
  body('author')
    .optional()
    .isString().withMessage('Author must be a string'),
  body('genre_ids')
    .optional()
    .isArray({ min: 1 }).withMessage('Genre IDs must be a non-empty array'),
  body('audience_ids')
    .optional()
    .isArray({ min: 1 }).withMessage('Audience IDs must be a non-empty array'),
];

module.exports = {
  createProductValidation,
  updateProductValidation,
};