const productService = require('../../services/v1/product.service');
const analyticsController = require('./analytics.controller');
const { productDetailsDTO } = require('../../dtos/v1/product.details.dto');
const { productCardDTO } = require('../../dtos/v1/product.card.dto');
const { productDeleteDTO } = require('../../dtos/v1/product.delete.dto');
const logger = require('../../utils/logger');

exports.createProduct = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body);
    
    // Notify about genre data update
    try {
      await analyticsController.notifyGenreDataUpdate();
    } catch (wsError) {
      logger.error('Error notifying about genre update after product creation:', wsError);
    }
    
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    
    // Notify about genre data update if genres were modified
    if (req.body.genres) {
      try {
        await analyticsController.notifyGenreDataUpdate();
      } catch (wsError) {
        logger.error('Error notifying about genre update after product update:', wsError);
      }
    }
    
    res.json(product);
  } catch (err) {
    next(err);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    // Get product details before deletion for notification
    const product = await productService.getProductDetails(req.params.id);
    await productService.deleteProduct(req.params.id);
    
    // Notify about genre data update if product had genres
    if (product && product.genres && product.genres.length > 0) {
      try {
        await analyticsController.notifyGenreDataUpdate();
      } catch (wsError) {
        logger.error('Error notifying about genre update after product deletion:', wsError);
      }
    }
    
    res.json(productDeleteDTO(req.params.id));
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