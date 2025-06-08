const express = require('express');
const router = express.Router();
const productController = require('../../controllers/v1/product.controller');
const { createProductValidation, updateProductValidation } = require('../../dtos/v1/product.dto');
const { validate } = require('../../middlewares/validate');
const { authenticate, authorize } = require('../../middlewares/auth');

// Public routes
router.get('/products', productController.listProducts);
router.get('/products/:id', productController.getProductDetails);

// Admin routes
router.post('/products', authenticate, authorize('admin'), createProductValidation, validate, productController.createProduct);
router.put('/products/:id', authenticate, authorize('admin'), updateProductValidation, validate, productController.updateProduct);
router.delete('/products/:id', authenticate, authorize('admin'), productController.deleteProduct);

module.exports = router; 