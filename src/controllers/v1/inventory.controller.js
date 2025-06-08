const inventoryService = require('../../services/v1/inventory.service');

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