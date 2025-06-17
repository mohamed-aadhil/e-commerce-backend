const userService = require('../../services/v1/user.service');
const { validationResult } = require('express-validator');

/**
 * Get current user's profile
 */
const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await userService.getUserById(userId);
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update current user's profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const userId = req.user.id;
    const updateData = req.body;
    
    const updatedUser = await userService.updateUser(userId, updateData);
    
    res.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all addresses for current user
 */
const getAddresses = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const addresses = await userService.getUserAddresses(userId);
    
    res.json({
      success: true,
      data: addresses
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a new address for current user
 */
const addAddress = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const userId = req.user.id;
    const addressData = req.body;
    
    const newAddress = await userService.addUserAddress(userId, addressData);
    
    res.status(201).json({
      success: true,
      data: newAddress
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an address
 */
const updateAddress = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const userId = req.user.id;
    const addressId = req.params.id;
    const updateData = req.body;
    
    const updatedAddress = await userService.updateUserAddress(userId, addressId, updateData);
    
    res.json({
      success: true,
      data: updatedAddress
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an address
 */
const deleteAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const addressId = req.params.id;
    
    await userService.deleteUserAddress(userId, addressId);
    
    res.json({
      success: true,
      message: 'Address deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress
};
