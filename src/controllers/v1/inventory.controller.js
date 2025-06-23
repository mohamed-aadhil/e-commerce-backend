const inventoryService = require('../../services/v1/inventory.service');
const analyticsController = require('./analytics.controller');
const { inventoryTransactionWithStockDTO } = require('../../dtos/v1/inventory.dto');
const logger = require('../../utils/logger');

/**
 * Helper method to notify clients about inventory changes
 * Wraps the notification in a try-catch to prevent it from affecting the main operation
 */
async function notifyInventoryChange(operation, productId) {
  try {
    await analyticsController.notifyInventoryUpdate();
    logger.info(`Inventory update notification sent after ${operation} for product ${productId}`);
  } catch (error) {
    // Log the error but don't fail the main operation
    logger.error(`Error notifying inventory update after ${operation} for product ${productId}:`, error);
  }
}

exports.restockProduct = async (req, res, next) => {
  const productId = req.params.id;
  try {
    const inventory = await inventoryService.restockProduct(productId, req.body);
    
    // Notify clients about the inventory update
    await notifyInventoryChange('restock', productId);
    
    res.status(200).json(inventory);
  } catch (err) {
    next(err);
  }
};

exports.getProductInventory = async (req, res, next) => {
  try {
    const inventory = await inventoryService.getProductInventory(req.params.id);
    res.status(200).json(inventory);
  } catch (err) {
    next(err);
  }
};

exports.getInventoryStats = async (req, res, next) => {
  try {
    const stats = await inventoryService.getInventoryStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
};

exports.getInventoryBooks = async (req, res, next) => {
  try {
    const books = await inventoryService.getInventoryBooks(req.query);
    res.json(books);
  } catch (err) {
    next(err);
  }
};

exports.getProductTransactionHistoryWithStock = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const transactions = await inventoryService.getProductTransactionHistoryWithStock(req.params.id, { from, to });
    if (!transactions || transactions.length === 0) return res.status(404).json({ error: 'No transactions found' });
    res.json(transactions.map(inventoryTransactionWithStockDTO));
  } catch (err) {
    next(err);
  }
}; 