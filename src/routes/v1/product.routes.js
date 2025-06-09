const express = require('express');
const router = express.Router();
const productController = require('../../controllers/v1/product.controller');
const { createProductValidation, updateProductValidation } = require('../../dtos/v1/product.dto');
const { validateRequest } = require('../../middlewares/validation.middleware');
const { authenticate, authorize } = require('../../middlewares/auth');

// Public routes
router.get('/products', productController.listProducts);
router.get('/products/:id', productController.getProductDetails);
router.get('/products/:id/details', productController.getProductDetailsWithStats);

// Admin routes
router.post('/products', authenticate, authorize('admin'), createProductValidation, validateRequest, productController.createProduct);
router.put('/products/:id', authenticate, authorize('admin'), updateProductValidation, validateRequest, productController.updateProduct);
router.delete('/products/:id', authenticate, authorize('admin'), productController.deleteProduct);

module.exports = router; 