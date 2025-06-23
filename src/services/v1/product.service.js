const { Op, DataTypes } = require('sequelize');
const { sequelize } = require('../../models');
const db = require('../../models');
const { productCardDTO } = require('../../dtos/v1/product.card.dto');
const analyticsController = require('../../controllers/v1/analytics.controller');
const logger = require('../../utils/logger');

// Destructure models from the centralized db object
const { 
  Product, 
  NewBook, 
  Genre, 
  BookGenre, 
  Audience, 
  BookAudience, 
  Inventory, 
  InventoryTransaction,
  UsedBook,
  Ebook
} = db;

const createProduct = async (data) => {
  return sequelize.transaction(async (t) => {
    // Ensure images is a valid array of strings
    let images = [];
    if (Array.isArray(data.images)) {
      images = data.images.filter(img => typeof img === 'string' && img.trim() !== '');
    }

    // Validate required fields
    if (!data.title || !data.product_type || !data.author || data.selling_price === undefined || data.cost_price === undefined) {
      const error = new Error('Title, product type, author, selling price, and cost price are required');
      error.status = 400;
      throw error;
    }

    // Check for duplicate product (product_type, title, author)
    const existing = await Product.findOne({
      where: {
        product_type: data.product_type,
        title: data.title,
        author: data.author,
      },
      transaction: t
    });
    if (existing) {
      const error = new Error('A product with the same type, title, and author already exists.');
      error.status = 409;
      throw error;
    }

    // 1. Create base product
    const product = await Product.create({
      title: data.title,
      selling_price: data.selling_price,
      cost_price: data.cost_price,
      description: data.description || null,
      product_type: data.product_type,
      metadata: data.metadata,
      images: images.length > 0 ? images : null, // store null if no valid images
      author: data.author,
    }, { transaction: t });

    // 2. Type-specific table
    switch (data.product_type) {
      case 'New Book':
        await NewBook.create({ product_id: product.id }, { transaction: t });
        break;
      // For future: Used Book, ebook
      case 'Used Book':
        await UsedBook.create({ product_id: product.id, condition: data.condition }, { transaction: t });
        break;
      case 'ebook':
        await Ebook.create({ product_id: product.id, file_format: data.file_format, download_url: data.download_url }, { transaction: t });
        break;
    }

    // 3. Associations
    if (data.genre_ids && Array.isArray(data.genre_ids)) {
      await BookGenre.bulkCreate(
        data.genre_ids.map(genre_id => ({ book_id: product.id, genre_id })),
        { transaction: t }
      );
    }
    if (data.audience_ids && Array.isArray(data.audience_ids)) {
      await BookAudience.bulkCreate(
        data.audience_ids.map(audience_id => ({ book_id: product.id, audience_id })),
        { transaction: t }
      );
    }

    // 4. Inventory logic: create inventory record with initial stock
    let inventoryCreated = false;
    if (typeof data.initial_stock === 'number' && data.initial_stock >= 0) {
      await Inventory.create({
        product_id: product.id,
        quantity: data.initial_stock,
      }, { transaction: t });

      // Create an inventory transaction for the initial stock
      await InventoryTransaction.create({
        product_id: product.id,
        change: data.initial_stock,
        reason: 'initial_stock',
      }, { transaction: t });
      
      inventoryCreated = true;
    }
    
    // 5. Notify about inventory update if stock was created
    if (inventoryCreated) {
      try {
        // We need to commit the transaction first before notifying
        await t.afterCommit(async () => {
          try {
            await analyticsController.notifyInventoryUpdate();
          } catch (error) {
            logger.error('Error in afterCommit inventory notification:', error);
          }
        });
      } catch (error) {
        logger.error('Error setting up afterCommit hook for inventory notification:', error);
      }
    }

    return product;
  });
};

const updateProduct = async (id, data) => {
  return sequelize.transaction(async (t) => {
    // 1. Update base product
    const product = await Product.findByPk(id, { transaction: t });
    if (!product) {
      const error = new Error('Product not found');
      error.status = 404;
      throw error;
    }

    // Prepare update data
    const updateData = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.selling_price !== undefined) updateData.selling_price = data.selling_price;
    if (data.cost_price !== undefined) updateData.cost_price = data.cost_price;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.product_type !== undefined) updateData.product_type = data.product_type;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;
    if (data.images !== undefined) {
      updateData.images = Array.isArray(data.images) ? 
        data.images.filter(img => typeof img === 'string' && img.trim() !== '') : 
        null;
    }
    if (data.author !== undefined) updateData.author = data.author;

    // Validate selling_price >= cost_price if either is being updated
    if ((data.selling_price !== undefined || data.cost_price !== undefined) && 
        (data.selling_price || product.selling_price) < (data.cost_price || product.cost_price)) {
      const error = new Error('Selling price must be greater than or equal to cost price');
      error.status = 400;
      throw error;
    }

    await product.update(updateData, { transaction: t });

    // 2. Update type-specific data if needed
    if (data.product_type) {
      switch (data.product_type) {
        case 'New Book':
          await NewBook.findOrCreate({ where: { product_id: id }, transaction: t });
          break;
        case 'Used Book':
          if (data.condition) {
            await UsedBook.upsert(
              { product_id: id, condition: data.condition },
              { transaction: t }
            );
          }
          break;
        case 'ebook':
          if (data.file_format || data.download_url) {
            await Ebook.upsert(
              { 
                product_id: id, 
                file_format: data.file_format,
                download_url: data.download_url
              },
              { transaction: t }
            );
          }
          break;
      }
    }

    // 3. Update associations if needed
    if (data.genre_ids && Array.isArray(data.genre_ids)) {
      await BookGenre.destroy({ where: { book_id: id }, transaction: t });
      await BookGenre.bulkCreate(
        data.genre_ids.map(genre_id => ({ book_id: id, genre_id })),
        { transaction: t }
      );
    }
    if (data.audience_ids && Array.isArray(data.audience_ids)) {
      await BookAudience.destroy({ where: { book_id: id }, transaction: t });
      await BookAudience.bulkCreate(
        data.audience_ids.map(audience_id => ({ book_id: id, audience_id })),
        { transaction: t }
      );
    }

    return product;
  });
};

const deleteProduct = async (id) => {
  return sequelize.transaction(async (t) => {
    const product = await Product.findByPk(id, { transaction: t });
    if (!product) {
      const error = new Error('Product not found');
      error.status = 404;
      throw error;
    }
    await product.destroy({ transaction: t });
    // All related records are deleted via ON DELETE CASCADE
    return;
  });
};

const listProducts = async (query) => {
  const where = {};
  if (query.product_type) where.product_type = query.product_type;
  if (query.title) where.title = { [Op.iLike]: `%${query.title}%` };
  if (query.isbn) where.metadata = { isbn: query.isbn };

  // Build include array with optional filters for genre and audience
  const include = [
    { 
      model: NewBook, 
      as: 'newBook', 
      required: false 
    },
    // For future: { model: UsedBook, required: false },
    // For future: { model: Ebook, required: false },
    {
      model: Genre,
      as: 'genres',
      through: { attributes: [] },
      ...(query.genre_id ? { where: { id: query.genre_id } } : {})
    },
    {
      model: Audience,
      as: 'audiences',
      through: { attributes: [] },
      ...(query.audience_id ? { where: { id: query.audience_id } } : {})
    },
    { 
      model: Inventory,
      as: 'inventory'
    }
  ];

  return Product.findAll({
    where,
    include,
    // Add pagination (limit, offset) if needed
  });
};

const getProductDetails = async (id) => {
  return Product.findByPk(id, {
    include: [
      { 
        model: NewBook, 
        as: 'newBook',
        required: false 
      },
      // For future: { model: UsedBook, as: 'usedBook', required: false },
      // For future: { model: Ebook, as: 'ebook', required: false },
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
        required: false
      }
    ]
  });
};

const getProductDetailsWithStats = async (id) => {
  // 1. Get product details (with inventory)
  const product = await Product.findByPk(id, {
    include: [
      { model: NewBook, as: 'newBook', required: false },
      { model: Genre, as: 'genres', through: { attributes: [] } },
      { model: Audience, as: 'audiences', through: { attributes: [] } },
      { model: Inventory, as: 'inventory', required: false }
    ]
  });
  if (!product) return null;

  // 2. Get current stock
  const currentStock = product.Inventory ? product.Inventory.quantity : 0;

  // 3. Get inventory transactions
  const transactions = await InventoryTransaction.findAll({
    where: { product_id: id },
    order: [['created_at', 'ASC']],
  });

  // 4. Calculate stats
  let totalSold = 0;
  let totalRestocked = 0;
  let salesLast30Days = 0;
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  for (const tx of transactions) {
    if (tx.change < 0 && tx.reason === 'order') {
      totalSold += Math.abs(tx.change);
      if (tx.created_at >= thirtyDaysAgo) {
        salesLast30Days += Math.abs(tx.change);
      }
    }
    if (tx.change > 0 && tx.reason === 'restock') {
      totalRestocked += tx.change;
    }
  }

  const averageDailySales = salesLast30Days / 30;
  const daysUntilEmpty = averageDailySales > 0 ? Math.floor(currentStock / averageDailySales) : null;
  const stockValue = currentStock * parseFloat(product.price);

  return {
    id: product.id,
    title: product.title,
    price: product.price,
    genre: product.genres && product.genres[0] ? product.genres[0].name : null,
    current_stock: currentStock,
    stats: {
      total_sold: totalSold,
      total_restocked: totalRestocked,
      stock_value: stockValue,
      average_daily_sales: Number(averageDailySales.toFixed(2)),
      days_until_empty: daysUntilEmpty
    },
    status: currentStock === 0 ? 'Out of Stock' : (currentStock < 10 ? 'Low Stock' : 'In Stock'),
    // Add more fields as needed
  };
};

const getProductsByGenreId = async (genreId) => {
  const products = await Product.findAll({
    include: [
      { 
        model: NewBook, 
        as: 'newBook',  
        required: false 
      },
      { 
        model: Genre, 
        as: 'genres',
        where: { id: genreId }, 
        through: { attributes: [] } 
      },
      { 
        model: Inventory, 
        as: 'inventory',
        required: false 
      },
    ],
  });
  return products.map(productCardDTO);
};

const getProductsByAudienceId = async (audienceId) => {
  const products = await Product.findAll({
    include: [
      { model: NewBook, as: 'newBook', required: false },
      { model: Audience, as: 'audiences', where: { id: audienceId }, through: { attributes: [] } },
      { model: Inventory, as: 'inventory', required: false },
    ],
  });
  return products.map(productCardDTO);
};

module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
  listProducts,
  getProductDetails,
  getProductDetailsWithStats,
  getProductsByGenreId,
  getProductsByAudienceId,
  productCardDTO
}; 