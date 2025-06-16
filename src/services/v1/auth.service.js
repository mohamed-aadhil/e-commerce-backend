const bcrypt = require('bcrypt');
const { generateAccessToken, generateRefreshToken, getRefreshTokenExpiryDate, verifyRefreshToken } = require('../../utils/token.util');
const { Op } = require('sequelize');
const db = require('../../models');
const { User, RefreshToken } = db;

const SALT_ROUNDS = 10;

async function register({ name, email, password, sessionId }) {
  console.log('[AUTH SERVICE] Register called with:', { name, email });
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    const error = new Error('Email already registered');
    error.status = 409;
    throw error;
  }
  
  let cartMerged = false;
  
  // Start a transaction
  const transaction = await db.sequelize.transaction();
  
  try {
    // Create user within the transaction
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({ 
      name, 
      email, 
      password_hash 
    }, { transaction });
    
    console.log('[AUTH SERVICE] User registered:', user.id);
    
    // Generate tokens with plain object payload
    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };
    
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken({ id: user.id });
    const expires_at = getRefreshTokenExpiryDate();
    
    // Create refresh token within the transaction
    await RefreshToken.create({ 
      user_id: user.id, 
      token: refreshToken, 
      expires_at 
    }, { transaction });
    
    // If sessionId is provided, merge the guest cart with the new user's cart
    if (sessionId) {
      try {
        const { mergeCarts } = require('./cart.service');
        await mergeCarts(sessionId, user.id, { transaction });
        cartMerged = true;
        console.log(`[AUTH SERVICE] Successfully merged cart for new user ${user.id}`);
      } catch (cartError) {
        console.error('[AUTH SERVICE] Error merging cart during registration:', cartError);
        // Don't fail registration if cart merge fails
      }
    }
    
    // Commit the transaction
    await transaction.commit();
    
    console.log('[AUTH SERVICE] Registration successful for user:', user.id, { cartMerged });
    return { 
      user, 
      accessToken, 
      refreshToken,
      cartMerged
    };
    
  } catch (error) {
    // Rollback the transaction in case of errors
    await transaction.rollback();
    console.error('[AUTH SERVICE] Registration failed:', error);
    throw error; // Re-throw the error to be handled by the controller
  }
}

async function login({ email, password, sessionId }) {
  console.log('[AUTH SERVICE] Login called with:', { email, sessionId });
  
  // Start a transaction
  const transaction = await db.sequelize.transaction();
  let cartMerged = false;
  
  try {
    const user = await User.findOne({ 
      where: { email },
      transaction 
    });
    
    if (!user) {
      console.log('[AUTH SERVICE] No user found for email:', email);
      const error = new Error('Invalid credentials');
      error.status = 401;
      throw error;
    }
    
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      console.log('[AUTH SERVICE] Invalid password for user:', user.id);
      const error = new Error('Invalid credentials');
      error.status = 401;
      throw error;
    }
    
    // Generate tokens with plain object payload
    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };
    
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken({ id: user.id });
    const expiresAt = getRefreshTokenExpiryDate();
    
    // Store refresh token
    await RefreshToken.create({ 
      user_id: user.id, 
      token: refreshToken, 
      expires_at: expiresAt 
    }, { transaction });
    
    // If sessionId is provided, merge the guest cart with the user's cart
    if (sessionId) {
      try {
        console.log(`[AUTH SERVICE] Attempting to merge cart for user ${user.id} with session ${sessionId}`);
        
        // First, check if there are any guest carts with this session ID
        const guestCart = await db.Cart.findOne({
          where: { 
            session_id: sessionId,
            is_guest: true
          },
          include: [{
            model: db.CartItem,
            as: 'items'
          }],
          transaction
        });
        
        console.log(`[AUTH SERVICE] Guest cart ${guestCart ? 'found' : 'not found'} for session ${sessionId}`);
        if (guestCart) {
          console.log(`[AUTH SERVICE] Guest cart has ${guestCart.items?.length || 0} items`);
        }
        
        // Now perform the merge
        const { mergeCarts } = require('./cart.service');
        const mergeResult = await mergeCarts(sessionId, user.id, { transaction });
        
        if (mergeResult) {
          cartMerged = true;
          console.log(`[AUTH SERVICE] Successfully merged cart for user ${user.id}. New cart has ${mergeResult.items?.length || 0} items`);
        } else {
          console.log(`[AUTH SERVICE] No cart merge was needed for user ${user.id}`);
        }
      } catch (cartError) {
        console.error('[AUTH SERVICE] Error merging cart during login:', {
          error: cartError,
          message: cartError.message,
          stack: cartError.stack
        });
        // Don't fail login if cart merge fails
      }
    } else {
      console.log('[AUTH SERVICE] No sessionId provided, skipping cart merge');
    }
    
    // Commit the transaction
    await transaction.commit();
    
    console.log('[AUTH SERVICE] Login successful for user:', user.id, { cartMerged });
    return { 
      user, 
      accessToken, 
      refreshToken,
      cartMerged 
    };
    
  } catch (error) {
    // Rollback the transaction in case of errors
    await transaction.rollback();
    console.error('[AUTH SERVICE] Login failed:', error);
    throw error; // Re-throw the error to be handled by the controller
  }
}

async function refresh({ refreshToken }) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (e) {
    throw new Error('Invalid refresh token');
  }
  const stored = await RefreshToken.findOne({ where: { token: refreshToken, revoked: false, expires_at: { [Op.gt]: new Date() } } });
  if (!stored) throw new Error('Refresh token not found or revoked');
  // Rotate token: revoke old, issue new
  stored.revoked = true;
  await stored.save();
  const user = await User.findByPk(payload.id);
  if (!user) throw new Error('User not found');
  const newAccessToken = generateAccessToken({ id: user.id, role: user.role, name: user.name });
  const newRefreshToken = generateRefreshToken({ id: user.id });
  const expires_at = getRefreshTokenExpiryDate();
  await RefreshToken.create({ user_id: user.id, token: newRefreshToken, expires_at, replaced_by_token: null });
  return { user, accessToken: newAccessToken, refreshToken: newRefreshToken };
}

async function logout({ refreshToken }) {
  const stored = await RefreshToken.findOne({ where: { token: refreshToken } });
  if (stored) {
    stored.revoked = true;
    await stored.save();
  }
  return { message: 'Logged out' };
}

module.exports = {
  register,
  login,
  refresh,
  logout,
}; 