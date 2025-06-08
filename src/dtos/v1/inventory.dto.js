const { body } = require('express-validator');

const restockValidation = [
  body('quantity')
    .isInt().withMessage('Quantity is required and must be an integer'),
  body('reason')
    .optional()
    .isString().withMessage('Reason must be a string'),
];

module.exports = {
  restockValidation,
}; 