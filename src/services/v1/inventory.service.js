const { Op, fn, col, literal } = require('sequelize');
const { sequelize } = require('../../models');
const db = require('../../models');
const { inventoryStatsDTO } = require('../../dtos/v1/inventory.stats.dto');
const { inventoryBookDTO } = require('../../dtos/v1/inventory.book.dto');

const { 
  Product, 
  Inventory, 
  InventoryTransaction, 
  NewBook, 
  Genre, 
  Audience, 
  BookGenre, 
  BookAudience 
} = db;

exports.restockProduct = async (productId, { quantity, reason }) => {
  if (!productId || typeof quantity !== 'number' || quantity <= 0) {
    const error = new Error('Invalid product ID or quantity');
    error.status = 400;
    throw error;
  }
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
  if (!productId) {
    const error = new Error('Product ID is required');
    error.status = 400;
    throw error;
  }
  const inventory = await Inventory.findOne({ where: { product_id: productId } });
  if (!inventory) {
    const error = new Error('Inventory not found for this product');
    error.status = 404;
    throw error;
  }
  const transactions = await InventoryTransaction.findAll({
    where: { product_id: productId },
    order: [['created_at', 'DESC']],
  });
  return {
    product_id: productId,
    quantity: inventory.quantity,
    transactions,
  };
};

exports.getInventoryStats = async () => {
  // Total books (unique products)
  const totalBooks = await Product.count();
  // Low stock items (stock < 10)
  const lowStockItems = await Inventory.count({ where: { quantity: { [Op.lt]: 10, [Op.gt]: 0 } } });
  // Out of stock items (products with inventory quantity 0 or no inventory record)
  const [results] = await sequelize.query(`
    SELECT COUNT(*) AS count
    FROM products p
    LEFT JOIN inventory i ON i.product_id = p.id
    WHERE i.quantity = 0 OR i.product_id IS NULL
  `);
  const outOfStock = Number(results[0].count);
  // Total value (sum of cost_price * stock, treat missing inventory as 0)
  const totalValueResult = await Product.findAll({
    include: [{
      model: Inventory,
      as: 'inventory',
      required: false,
      attributes: []
    }],
    attributes: [
      'cost_price',
      [sequelize.fn('COALESCE', sequelize.col('inventory.quantity'), 0), 'quantity']
    ],
    raw: true
  });
  
  const totalValue = totalValueResult.reduce((sum, row) => {
    const costPrice = parseFloat(row.cost_price) || 0;
    const quantity = parseInt(row.quantity, 10) || 0;
    return sum + (costPrice * quantity);
  }, 0);
  
  return inventoryStatsDTO({ totalBooks, lowStockItems, totalValue, outOfStock });
};

exports.getInventoryBooks = async (query) => {
  const where = {};
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  const offset = (page - 1) * limit;
  
  // Support searching by product ID or title
  if (query.productId) {
    where.id = query.productId;
  } else if (query.title) {
    where.title = { [Op.iLike]: `%${query.title}%` };
  }
  
  const include = [
    {
      model: Genre,
      as: 'genres',
      through: { 
        model: BookGenre,
        attributes: []
      },
      attributes: ['id', 'name']
    },
    {
      model: Audience,
      as: 'audiences',
      through: { 
        model: BookAudience,
        attributes: []
      },
      attributes: ['id', 'name']
    },
    { 
      model: Inventory,
      as: 'inventory',
      required: false,
      attributes: ['quantity']
    }
  ];

  const { count, rows: products } = await Product.findAndCountAll({
    where,
    include,
    limit,
    offset,
    order: [['created_at', 'DESC']],
    distinct: true,
    subQuery: false  // Important for correct counting with includes
  });
  
  if (!products || products.length === 0) {
    const error = new Error('No inventory books found');
    error.status = 404;
    throw error;
  }
  
  return {
    data: products.map(product => inventoryBookDTO(product)),
    pagination: {
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
      limit
    }
  };
};

exports.getProductTransactionHistoryWithStock = async (productId, { from, to } = {}) => {
  if (!productId) {
    const error = new Error('Product ID is required');
    error.status = 400;
    throw error;
  }
  const where = { product_id: productId };
  if (from) where.created_at = { ...where.created_at, [Op.gte]: from };
  if (to) where.created_at = { ...where.created_at, [Op.lte]: to };

  // Get all transactions in ascending order
  const transactions = await InventoryTransaction.findAll({
    where,
    order: [['created_at', 'ASC']],
    raw: true
  });

  if (!transactions || transactions.length === 0) {
    const error = new Error('No transactions found for this product');
    error.status = 404;
    throw error;
  }

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