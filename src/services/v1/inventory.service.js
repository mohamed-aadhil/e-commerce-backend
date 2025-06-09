const { Inventory, InventoryTransaction, Product, NewBook, Genre, Audience } = require('../../models/product');
const { sequelize } = require('../../models/product/Product');
const { Op, fn, col, literal } = require('sequelize');
const { inventoryStatsDTO } = require('../../dtos/v1/inventory.stats.dto');
const { inventoryBookDTO } = require('../../dtos/v1/inventory.book.dto');

exports.restockProduct = async (productId, { quantity, reason }) => {
  return sequelize.transaction(async (t) => {
    let inventory = await Inventory.findOne({ where: { product_id: productId }, transaction: t });
    if (!inventory) {
      inventory = await Inventory.create({ product_id: productId, quantity: 0 }, { transaction: t });
    }
    await inventory.update({ quantity: inventory.quantity + quantity }, { transaction: t });
    await InventoryTransaction.create({
      product_id: productId,
      change: quantity,
      reason: reason || 'restock',
    }, { transaction: t });
    return inventory;
  });
};

exports.getProductInventory = async (productId) => {
  const inventory = await Inventory.findOne({ where: { product_id: productId } });
  const transactions = await InventoryTransaction.findAll({
    where: { product_id: productId },
    order: [['created_at', 'DESC']],
  });
  return {
    product_id: productId,
    quantity: inventory ? inventory.quantity : 0,
    transactions,
  };
};

exports.getInventoryStats = async () => {
  // Total books (unique products)
  const totalBooks = await Product.count();
  // Low stock items (stock < 10)
  const lowStockItems = await Inventory.count({ where: { quantity: { [Op.lt]: 10, [Op.gt]: 0 } } });
  // Out of stock items (stock = 0)
  const outOfStock = await Inventory.count({ where: { quantity: 0 } });
  // Total value (sum of price * stock)
  const totalValueResult = await Product.findAll({
    include: [{ model: Inventory }],
    attributes: [],
    raw: true
  });
  let totalValue = 0;
  for (const row of totalValueResult) {
    if (row['Inventory.quantity'] && row.price) {
      totalValue += Number(row.price) * Number(row['Inventory.quantity']);
    }
  }
  return inventoryStatsDTO({ totalBooks, lowStockItems, totalValue, outOfStock });
};

exports.getInventoryBooks = async (query) => {
  // Optionally add filters (search, genre, etc.)
  const where = {};
  if (query.title) where.title = { [Op.iLike]: `%${query.title}%` };
  const include = [
    { model: NewBook, required: false },
    { model: Genre, through: { attributes: [] } },
    { model: Audience, through: { attributes: [] } },
    { model: Inventory }
  ];
  const products = await Product.findAll({ where, include });
  return products.map(inventoryBookDTO);
};

exports.getProductTransactionHistoryWithStock = async (productId, { from, to } = {}) => {
  const where = { product_id: productId };
  if (from) where.created_at = { ...where.created_at, [Op.gte]: from };
  if (to) where.created_at = { ...where.created_at, [Op.lte]: to };

  // Get all transactions in ascending order
  const transactions = await InventoryTransaction.findAll({
    where,
    order: [['created_at', 'ASC']],
    raw: true
  });

  // Calculate running stock
  let stock = 0;
  // Get initial stock before the first transaction in range
  if (transactions.length > 0) {
    const firstDate = transactions[0].created_at;
    const prevSum = await InventoryTransaction.sum('change', {
      where: {
        product_id: productId,
        created_at: { [Op.lt]: firstDate }
      }
    });
    stock = prevSum || 0;
  }

  const result = [];
  for (const tx of transactions) {
    stock += tx.change;
    result.push({ ...tx, stock });
  }
  return result;
}; 