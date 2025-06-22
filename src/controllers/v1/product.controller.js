const productService = require('../../services/v1/product.service');
const analyticsController = require('./analytics.controller');
const webSocketService = require('../../services/websocket.service');
const { productDetailsDTO } = require('../../dtos/v1/product.details.dto');
const { productCardDTO } = require('../../dtos/v1/product.card.dto');
const { productDeleteDTO } = require('../../dtos/v1/product.delete.dto');
const logger = require('../../utils/logger');

exports.createProduct = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body);
    
    // Notify about genre data update and price changes if there are genres
    if (req.body.genres && req.body.genres.length > 0) {
      try {
        await analyticsController.notifyGenreDataUpdate();
        
        // Notify about price changes for each genre
        await Promise.all(
          req.body.genres.map(genreId => 
            webSocketService.broadcastPriceUpdate(genreId)
          )
        );
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
    // Get the current product to check for price or genre changes
    const currentProduct = await productService.getProductDetails(req.params.id);
    const product = await productService.updateProduct(req.params.id, req.body);
    
    // Check if we need to notify about genre or price changes
    const shouldNotifyGenreUpdate = req.body.genres && 
      JSON.stringify(currentProduct.genres) !== JSON.stringify(req.body.genres);
      
    const shouldNotifyPriceUpdate = (req.body.cost_price !== undefined && 
      parseFloat(req.body.cost_price) !== parseFloat(currentProduct.cost_price)) ||
      (req.body.selling_price !== undefined && 
      parseFloat(req.body.selling_price) !== parseFloat(currentProduct.selling_price));
    
    // Get the affected genre IDs
    const affectedGenreIds = new Set([
      ...(currentProduct.genres || []).map(g => g.id),
      ...(req.body.genres || [])
    ].filter(Boolean));
    
    // Notify about genre data update if genres were modified
    if (shouldNotifyGenreUpdate) {
      try {
        await analyticsController.notifyGenreDataUpdate();
      } catch (wsError) {
        logger.error('Error notifying about genre update after product update:', wsError);
      }
    }
    
    // Notify about price changes for each affected genre
    if (shouldNotifyPriceUpdate && affectedGenreIds.size > 0) {
      try {
        await Promise.all(
          Array.from(affectedGenreIds).map(genreId => 
            webSocketService.broadcastPriceUpdate(genreId)
          )
        );
      } catch (wsError) {
        logger.error('Error notifying about price update:', wsError);
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
    
    // Notify about genre data update and price changes if product had genres
    if (product && product.genres && product.genres.length > 0) {
      try {
        await analyticsController.notifyGenreDataUpdate();
        
        // Notify about price changes for each genre
        await Promise.all(
          product.genres.map(genre => 
            webSocketService.broadcastPriceUpdate(genre.id)
          )
        );
      } catch (wsError) {
        logger.error('Error notifying about updates after product deletion:', wsError);
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