const { body } = require('express-validator');

const restockValidation = [
  body('quantity')
    .isInt().withMessage('Quantity is required and must be an integer'),
  body('reason')
    .optional()
    .isString().withMessage('Reason must be a string'),
];

function inventoryTransactionWithStockDTO(tx) {
  return {
    id: tx.id,
    product_id: tx.product_id,
    change: tx.change,
    reason: tx.reason,
    created_at: tx.created_at,
    stock: tx.stock,
  };
}

module.exports = {
  restockValidation,
  inventoryTransactionWithStockDTO,
}; 