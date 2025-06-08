const { body } = require('express-validator');

const createProductValidation = [
  body('title')
    .isString().withMessage('Title must be a string')
    .notEmpty().withMessage('Title is required'),
  body('price')
    .isFloat({ gt: 0 }).withMessage('Price must be a positive number'),
  body('product_type')
    .isIn(['new_book']).withMessage('Only "new_book" is supported at this time'),
  body('metadata')
    .optional()
    .isObject().withMessage('Metadata must be an object'),
  body('images')
    .optional()
    .isArray().withMessage('Images must be an array of URLs'),
  // Author required for new_book
  body('author')
    .if(body('product_type').equals('new_book'))
    .isString().withMessage('Author is required for new books'),
  // For future: used_book fields
  body('condition')
    .if(body('product_type').equals('used_book'))
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
  // Inventory
  body('quantity')
    .isInt({ min: 0 }).withMessage('Initial stock quantity is required and must be a non-negative integer'),
];

const updateProductValidation = [
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
    .isArray().withMessage('Images must be an array of URLs'),
  body('author')
    .optional()
    .isString().withMessage('Author must be a string'),
  body('condition')
    .optional()
    .isString().withMessage('Condition must be a string'),
  body('file_format')
    .optional()
    .isString().withMessage('File format must be a string'),
  body('download_url')
    .optional()
    .isString().withMessage('Download URL must be a string'),
  body('genre_ids')
    .optional()
    .isArray({ min: 1 }).withMessage('At least one genre is required'),
  body('audience_ids')
    .optional()
    .isArray({ min: 1 }).withMessage('At least one audience is required'),
  body('quantity')
    .optional()
    .isInt({ min: 0 }).withMessage('Stock quantity must be a non-negative integer'),
];

module.exports = {
  createProductValidation,
  updateProductValidation,
}; 