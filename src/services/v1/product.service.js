const { Product, NewBook, UsedBook, Ebook, Genre, BookGenre, Audience, BookAudience, Inventory, InventoryTransaction } = require('../../models/product');
const { sequelize } = require('../../models/product/Product');

exports.createProduct = async (data) => {
  return sequelize.transaction(async (t) => {
    // 1. Create base product
    const product = await Product.create({
      title: data.title,
      price: data.price,
      product_type: data.product_type,
      metadata: data.metadata,
      images: data.images,
    }, { transaction: t });

    // 2. Type-specific table
    switch (data.product_type) {
      case 'new_book':
        await NewBook.create({ product_id: product.id, author: data.author }, { transaction: t });
        break;
      // For future: used_book, ebook
      case 'used_book':
        await UsedBook.create({ product_id: product.id, author: data.author, condition: data.condition }, { transaction: t });
        break;
      case 'ebook':
        await Ebook.create({ product_id: product.id, author: data.author, file_format: data.file_format, download_url: data.download_url }, { transaction: t });
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

    // 4. Inventory logic removed from product creation

    return product;
  });
};

exports.updateProduct = async (id, data) => {
  return sequelize.transaction(async (t) => {
    // 1. Update base product
    const product = await Product.findByPk(id, { transaction: t });
    if (!product) throw new Error('Product not found');

    await product.update({
      title: data.title ?? product.title,
      price: data.price ?? product.price,
      metadata: data.metadata ?? product.metadata,
      images: data.images ?? product.images,
    }, { transaction: t });

    // 2. Update type-specific table (new_book for now)
    if (product.product_type === 'new_book') {
      const newBook = await NewBook.findOne({ where: { product_id: id }, transaction: t });
      if (newBook && data.author) {
        await newBook.update({ author: data.author }, { transaction: t });
      }
    }
    // (future: handle used_book, ebook)

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

exports.deleteProduct = async (id) => {
  // Implement delete logic (delete product and related records)
};

exports.listProducts = async (query) => {
  // Implement product listing with filters, joins for genres/audiences, and inventory
};

exports.getProductDetails = async (id) => {
  // Implement product detail fetch with joins for type-specific, genres, audiences, inventory
}; 