const express = require('express');
const router = express.Router();
const inventoryController = require('../../controllers/v1/inventory.controller');
const { restockValidation } = require('../../dtos/v1/inventory.dto');
const { validate } = require('../../middlewares/validate');
const { authenticate, authorize } = require('../../middlewares/auth');

// Restock inventory (admin only)
router.post('/products/:id/restock', authenticate, authorize('admin'), restockValidation, validate, inventoryController.restockProduct);

// Get product inventory (public or admin)
router.get('/products/:id/inventory', inventoryController.getProductInventory);

// Inventory stats for dashboard (admin only)
router.get('/inventory/stats', authenticate, authorize('admin'), inventoryController.getInventoryStats);

// Book inventory table for dashboard (admin only)
router.get('/inventory/books', authenticate, authorize('admin'), inventoryController.getInventoryBooks);

module.exports = router; 