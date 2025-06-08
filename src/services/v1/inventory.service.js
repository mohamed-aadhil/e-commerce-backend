const { Inventory, InventoryTransaction } = require('../../models/product');
const { sequelize } = require('../../models/product/Product');

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