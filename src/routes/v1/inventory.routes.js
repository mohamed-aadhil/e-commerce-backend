const express = require('express');
const router = express.Router();
const inventoryController = require('../../controllers/v1/inventory.controller');
const { restockValidation } = require('../../dtos/v1/inventory.dto');
const { authenticate, authorize } = require('../../middlewares/auth');
const { validateRequest } = require('../../middlewares/validation.middleware');

// Restock inventory (admin only)
router.post('/products/:id/restock', authenticate, authorize('admin'), restockValidation, validateRequest, inventoryController.restockProduct);

// Get product inventory (admin only)
router.get('/products/:id/inventory', authenticate, authorize('admin'), inventoryController.getProductInventory);

// Inventory stats for dashboard (admin only)
router.get('/inventory/stats', authenticate, authorize('admin'), inventoryController.getInventoryStats);

// Book inventory table for dashboard (admin only)
router.get('/inventory/books', authenticate, authorize('admin'), inventoryController.getInventoryBooks);

// Get product inventory transactions (admin only)
router.get('/products/:id/inventory/transactions', authenticate, authorize('admin'), inventoryController.getProductTransactionHistoryWithStock);

module.exports = router; 