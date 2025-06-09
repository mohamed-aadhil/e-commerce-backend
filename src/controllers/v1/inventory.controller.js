const inventoryService = require('../../services/v1/inventory.service');
const { inventoryTransactionWithStockDTO } = require('../../dtos/v1/inventory.dto');

exports.restockProduct = async (req, res, next) => {
  try {
    const inventory = await inventoryService.restockProduct(req.params.id, req.body);
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