const productService = require('../../services/v1/product.service');
const analyticsController = require('./analytics.controller');
const { productDetailsDTO } = require('../../dtos/v1/product.details.dto');
const { productCardDTO } = require('../../dtos/v1/product.card.dto');
const { productDeleteDTO } = require('../../dtos/v1/product.delete.dto');
const logger = require('../../utils/logger');

/**
 * Get unique genre IDs from product data
 * @param {Object} product - Product data
 * @returns {number[]} Array of unique genre IDs
 */
function getUniqueGenreIds(product) {
  if (!product || !product.genres) return [];
  return [...new Set(product.genres.map(genre => 
    typeof genre === 'object' ? genre.id : genre
  ))];
}

exports.createProduct = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body);
    
    // Notify about analytics updates if there are genres
    const genreIds = getUniqueGenreIds({ genres: req.body.genres });
    if (genreIds.length > 0) {
      try {
        await analyticsController.notifyAllUpdates(genreIds[0]);
      } catch (wsError) {
        logger.error('Error notifying about updates after product creation:', wsError);
      }
    }
    
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    // Get current product with genres before update
    const currentProduct = await productService.getProductDetails(req.params.id);
    
    // Perform the update
    const product = await productService.updateProduct(req.params.id, req.body);
    
    // Get the updated product with fresh data
    const updatedProduct = await productService.getProductDetails(req.params.id);
    
    // Get all affected genre IDs (current and updated)
    const currentGenreIds = getUniqueGenreIds(currentProduct);
    const updatedGenreIds = getUniqueGenreIds(updatedProduct);
    const allAffectedGenreIds = [...new Set([...currentGenreIds, ...updatedGenreIds])];
    
    // Notify about all updates for the first affected genre (if any)
    if (allAffectedGenreIds.length > 0) {
      try {
        await analyticsController.notifyAllUpdates(allAffectedGenreIds[0]);
      } catch (wsError) {
        logger.error('Error notifying about updates after product update:', wsError);
      }
    }
    
    res.json(product);
  } catch (err) {
    next(err);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    // Get product with genres before deletion
    const product = await productService.getProductDetails(req.params.id);
    
    // Extract genre IDs before deletion
    const genreIds = getUniqueGenreIds(product);
    
    // Delete the product
    await productService.deleteProduct(req.params.id);
    
    // Notify about all updates for the first genre (if any)
    if (genreIds.length > 0) {
      try {
        await analyticsController.notifyAllUpdates(genreIds[0]);
      } catch (wsError) {
        logger.error('Error notifying about updates after product deletion:', wsError);
      }
    }
    
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    next(err);
  }
};

exports.listProducts = async (req, res, next) => {
  try {
    const products = await productService.listProducts(req.query);
    res.json(products.map(productCardDTO));
  } catch (err) {
    next(err);
  }
};

exports.getProductDetails = async (req, res, next) => {
  try {
    const product = await productService.getProductDetails(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(productDetailsDTO(product));
  } catch (err) {
    next(err);
  }
};

exports.getProductDetailsWithStats = async (req, res, next) => {
  try {
    const product = await productService.getProductDetailsWithStats(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    next(err);
  }
}; 