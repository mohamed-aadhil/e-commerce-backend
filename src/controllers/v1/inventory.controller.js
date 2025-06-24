const inventoryService = require('../../services/v1/inventory.service');
const analyticsController = require('./analytics.controller');
const { inventoryTransactionWithStockDTO } = require('../../dtos/v1/inventory.dto');
const logger = require('../../utils/logger');

/**
 * Helper method to notify clients about inventory changes
 * Wraps the notification in a try-catch to prevent it from affecting the main operation
 * @param {string} operation - The operation that triggered the notification
 * @param {string} productId - The ID of the affected product
 * @param {string} [genreId] - Optional genre ID for targeted notifications
 */
async function notifyInventoryChange(operation, productId, genreId) {
  try {
    // Notify about all updates (inventory, genre, price) for the product's genre
    const result = await analyticsController.notifyAllUpdates(genreId);
    
    if (result.inventory.success) {
      logger.debug(`Inventory update notification sent after ${operation} for product ${productId}`);
    } else {
      logger.warn(`Partial failure in inventory notification after ${operation} for product ${productId}: ${result.inventory.error}`);
    }
    
    return result;
  } catch (error) {
    // Log the error but don't fail the main operation
    logger.error(`Error notifying inventory update after ${operation} for product ${productId}:`, error);
    return { success: false, error: error.message };
  }
}

exports.restockProduct = async (req, res, next) => {
  const productId = req.params.id;
  try {
    // Get product details to determine genre for targeted notifications
    const product = await inventoryService.getProductWithDetails(productId);
    const genreId = product?.genres?.[0]?.id;
    
    const inventory = await inventoryService.restockProduct(productId, req.body);
    
    // Notify clients about the inventory update
    await notifyInventoryChange('restock', productId, genreId);
    
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