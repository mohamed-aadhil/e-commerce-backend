const productService = require('../../services/v1/product.service');
const { productDetailsDTO } = require('../../dtos/v1/product.details.dto');
const { productCardDTO } = require('../../dtos/v1/product.card.dto');
const { productDeleteDTO } = require('../../dtos/v1/product.delete.dto');

exports.createProduct = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body);
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    res.json(product);
  } catch (err) {
    next(err);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    await productService.deleteProduct(req.params.id);
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