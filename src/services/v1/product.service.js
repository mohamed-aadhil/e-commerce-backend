const { Product, NewBook, UsedBook, Ebook, Genre, BookGenre, Audience, BookAudience, Inventory, InventoryTransaction } = require('../../models/product');
const { sequelize } = require('../../models/product/Product');
const { Op } = require('sequelize');
const { productCardDTO } = require('../../dtos/v1/product.card.dto');
const { DataTypes } = require('sequelize');

const createProduct = async (data) => {
  return sequelize.transaction(async (t) => {
    // Ensure images is a valid array of strings
    let images = [];
    if (Array.isArray(data.images)) {
      images = data.images.filter(img => typeof img === 'string' && img.trim() !== '');
    }

    // Validate required fields
    if (!data.title || !data.product_type || !data.author) {
      const error = new Error('Title, product type, and author are required');
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
      price: data.price,
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

    // Check for duplicate product (product_type, title, author) if any of these fields are being updated
    const newProductType = data.product_type ?? product.product_type;
    const newTitle = data.title ?? product.title;
    const newAuthor = data.author ?? product.author;
    const duplicate = await Product.findOne({
      where: {
        product_type: newProductType,
        title: newTitle,
        author: newAuthor,
        id: { [Op.ne]: id },
      },
      transaction: t
    });
    if (duplicate) {
      const error = new Error('A product with the same type, title, and author already exists.');
      error.status = 409;
      throw error;
    }

    await product.update({
      title: data.title ?? product.title,
      price: data.price ?? product.price,
      metadata: data.metadata ?? product.metadata,
      images: data.images ?? product.images,
      author: data.author ?? product.author,
    }, { transaction: t });

    // 2. Update type-specific table (New Book for now)
    // No author update needed in NewBook, UsedBook, or Ebook

    // 3. Update associations (replace all for simplicity)
    if (data.genre_ids) {
      await BookGenre.destroy({ where: { book_id: id }, transaction: t });
      await BookGenre.bulkCreate(
        data.genre_ids.map(genre_id => ({ book_id: id, genre_id })),
        { transaction: t }
      );
    }
    if (data.audience_ids) {
      await BookAudience.destroy({ where: { book_id: id }, transaction: t });
      await BookAudience.bulkCreate(
        data.audience_ids.map(audience_id => ({ book_id: id, audience_id })),
        { transaction: t }
      );
    }

    // 4. Do NOT update inventory or inventory_transactions here

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
    { model: NewBook, required: false },
    // For future: { model: UsedBook, required: false },
    // For future: { model: Ebook, required: false },
    {
      model: Genre,
      through: { attributes: [] },
      ...(query.genre_id ? { where: { id: query.genre_id } } : {})
    },
    {
      model: Audience,
      through: { attributes: [] },
      ...(query.audience_id ? { where: { id: query.audience_id } } : {})
    },
    { model: Inventory }
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
      { model: NewBook, required: false },
      // For future: { model: UsedBook, required: false },
      // For future: { model: Ebook, required: false },
      {
        model: Genre,
        through: {
          model: BookGenre,
          attributes: []
        }
      },
      {
        model: Audience,
        through: {
          model: BookAudience,
          attributes: []
        }
      },
      { model: Inventory }
    ]
  });
};

const getProductDetailsWithStats = async (id) => {
  // 1. Get product details (with inventory)
  const product = await Product.findByPk(id, {
    include: [
      { model: NewBook, required: false },
      { model: Genre, through: { attributes: [] } },
      { model: Audience, through: { attributes: [] } },
      { model: Inventory }
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
    genre: product.Genres && product.Genres[0] ? product.Genres[0].name : null,
    current_stock: currentStock,
    stats: {
      total_sold: totalSold,
      total_restocked: totalRestocked,
      stock_value: stockValue,
      average_daily_sales: Number(averageDailySales.toFixed(2)),
      days_until_empty: daysUntilEmpty
    },
    status: product.status || 'Active',
    // Add more fields as needed
  };
};

const getProductsByGenreId = async (genreId) => {
  const products = await Product.findAll({
    include: [
      { model: NewBook, required: false },
      { model: Genre, where: { id: genreId }, through: { attributes: [] } },
      { model: Inventory, required: false },
    ],
  });
  return products.map(productCardDTO);
};

const getProductsByAudienceId = async (audienceId) => {
  const products = await Product.findAll({
    include: [
      { model: NewBook, required: false },
      { model: Audience, where: { id: audienceId }, through: { attributes: [] } },
      { model: Inventory, required: false },
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