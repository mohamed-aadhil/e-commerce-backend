const { body } = require('express-validator');

const createProductValidation = [
  body('title')
    .isString().withMessage('Title must be a string')
    .notEmpty().withMessage('Title is required'),
  body('price')
    .isFloat({ gt: 0 }).withMessage('Price must be a positive number'),
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
  // Author required for new_book
  body('author')
    .isString().withMessage('Author is required for new books'),
  // For future: Used book fields
  body('condition')
    .if(body('product_type').equals('Used book'))
    .isString().withMessage('Condition is required for used books'),
  // For future: ebook fields
  body('file_format')
    .if(body('product_type').equals('ebook'))
    .isString().withMessage('File format is required for ebooks'),
  body('download_url')
    .if(body('product_type').equals('ebook'))
    .isString().withMessage('Download URL is required for ebooks'),
  // Associations
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
  body('price')
    .optional()
    .isFloat({ gt: 0 }).withMessage('Price must be a positive number'),
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
    .optional()
    .isString().withMessage('Author must be a string'),
  // For future: Used book fields
  body('condition')
    .if(body('product_type').equals('Used book'))
    .isString().withMessage('Condition is required for used books'),
  // For future: ebook fields
  body('file_format')
    .if(body('product_type').equals('ebook'))
    .isString().withMessage('File format is required for ebooks'),
  body('download_url')
    .if(body('product_type').equals('ebook'))
    .isString().withMessage('Download URL is required for ebooks'),
  body('genre_ids')
    .optional()
    .isArray({ min: 1 }).withMessage('At least one genre is required'),
  body('audience_ids')
    .optional()
    .isArray({ min: 1 }).withMessage('At least one audience is required'),
];

module.exports = {
  createProductValidation,
  updateProductValidation,
}; 