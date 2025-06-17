const db = require('../../models');

/**
 * Get user by ID with basic profile info
 */
const getUserById = async (userId) => {
  const user = await db.User.findByPk(userId, {
    attributes: ['id', 'name', 'email', 'createdAt', 'updatedAt', 'role'],
    include: [
      {
        model: db.Address,
        as: 'addresses',
        required: false,
        limit: 1
      }
    ]
  });

  if (!user) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }

  return user.get({ plain: true });
};

/**
 * Update user profile
 */
const updateUser = async (userId, updateData) => {
  const allowedFields = ['name', 'email'];
  const updateFields = {};

  // Filter only allowed fields
  Object.keys(updateData).forEach(key => {
    if (allowedFields.includes(key)) {
      updateFields[key] = updateData[key];
    }
  });

  if (Object.keys(updateFields).length === 0) {
    const error = new Error('No valid fields to update');
    error.status = 400;
    throw error;
  }

  const [updated] = await db.User.update(updateFields, {
    where: { id: userId },
    returning: true,
    plain: true
  });

  if (!updated) {
    const error = new Error('User not found or no changes made');
    error.status = 404;
    throw error;
  }

  return getUserById(userId);
};

/**
 * Get all addresses for a user
 */
const getUserAddresses = async (userId) => {
  const addresses = await db.Address.findAll({
    where: { user_id: userId },
    order: [['created_at', 'DESC']]
  });

  return addresses.map(addr => ({
    id: addr.id,
    recipientName: addr.recipient_name,
    addressLine1: addr.address_line1,
    addressLine2: addr.address_line2,
    city: addr.city,
    state: addr.state,
    postalCode: addr.postal_code,
    country: addr.country,
    mobileNumber: addr.mobile_number,
    createdAt: addr.created_at
  }));
};

/**
 * Add a new address for a user
 */
const addUserAddress = async (userId, addressData) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const newAddress = await db.Address.create(
      {
        user_id: userId,
        recipient_name: addressData.recipientName,
        address_line1: addressData.addressLine1,
        address_line2: addressData.addressLine2 || null,
        city: addressData.city,
        state: addressData.state,
        postal_code: addressData.postalCode,
        country: addressData.country,
        mobile_number: addressData.mobileNumber
      },
      { transaction }
    );

    await transaction.commit();
    
    return {
      id: newAddress.id,
      recipientName: newAddress.recipient_name,
      addressLine1: newAddress.address_line1,
      addressLine2: newAddress.address_line2,
      city: newAddress.city,
      state: newAddress.state,
      postalCode: newAddress.postal_code,
      country: newAddress.country,
      mobileNumber: newAddress.mobile_number,
      createdAt: newAddress.created_at
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Update an address
 */
const updateUserAddress = async (userId, addressId, updateData) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const [updated] = await db.Address.update(
      {
        recipient_name: updateData.recipientName,
        address_line1: updateData.addressLine1,
        address_line2: updateData.addressLine2 || null,
        city: updateData.city,
        state: updateData.state,
        postal_code: updateData.postalCode,
        country: updateData.country,
        mobile_number: updateData.mobileNumber
      },
      {
        where: { id: addressId, user_id: userId },
        returning: true,
        plain: true,
        transaction
      }
    );

    if (!updated) {
      await transaction.rollback();
      const error = new Error('Address not found');
      error.status = 404;
      throw error;
    }

    await transaction.commit();
    
    // Return the updated address
    const address = await db.Address.findByPk(addressId);
    return {
      id: address.id,
      recipientName: address.recipient_name,
      addressLine1: address.address_line1,
      addressLine2: address.address_line2,
      city: address.city,
      state: address.state,
      postalCode: address.postal_code,
      country: address.country,
      mobileNumber: address.mobile_number,
      createdAt: address.created_at
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Delete an address
 */
const deleteUserAddress = async (userId, addressId) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const address = await db.Address.findOne({
      where: { id: addressId, user_id: userId },
      transaction
    });

    if (!address) {
      await transaction.rollback();
      const error = new Error('Address not found');
      error.status = 404;
      throw error;
    }
    
    await db.Address.destroy({
      where: { id: addressId, user_id: userId },
      transaction
    });
    
    await transaction.commit();
    return true;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

module.exports = {
  getUserById,
  updateUser,
  getUserAddresses,
  addUserAddress,
  updateUserAddress,
  deleteUserAddress
};
