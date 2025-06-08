function inventoryStatsDTO({ totalBooks, lowStockItems, totalValue, outOfStock }) {
  return {
    totalBooks,
    lowStockItems,
    totalValue,
    outOfStock,
  };
}

module.exports = { inventoryStatsDTO }; 