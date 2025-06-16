const authService = require('../../services/v1/auth.service');
const cartService = require('../../services/v1/cart.service');
const UserDto = require('../../dtos/v1/user.dto');
const AuthResponseDto = require('../../dtos/v1/auth.dto');

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/api/v1/auth/refresh',
  // maxAge will be set dynamically
};

exports.register = async (req, res, next) => {
  try {
    // Include the session ID for cart merging
    const registrationData = {
      ...req.body,
      sessionId: req.sessionID // Add the current session ID
    };
    
    const { user, accessToken, refreshToken, cartMerged } = await authService.register(registrationData);
    
    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      ...REFRESH_COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    
    // Include cart merge status in the response
    const response = new AuthResponseDto(user, accessToken, refreshToken);
    response.cartMerged = cartMerged;
    
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    // 1. Capture guest session ID before login
    const guestSessionId = req.sessionID;
    console.log('[AUTH CONTROLLER] Login started. Guest session ID:', guestSessionId);
    
    // Log session details for debugging
    console.log('[AUTH CONTROLLER] Session details:', {
      id: req.sessionID,
      cookie: req.session.cookie,
      user: req.session.user
    });
    
    // 2. Authenticate user and merge cart in a single transaction
    console.log('[AUTH CONTROLLER] Calling authService.login with:', {
      email: req.body.email,
      sessionId: guestSessionId
    });
    
    const { user, accessToken, refreshToken, cartMerged } = await authService.login({
      ...req.body,
      sessionId: guestSessionId
    });
    
    console.log('[AUTH CONTROLLER] Login successful, cartMerged:', cartMerged);
    
    if (cartMerged) {
      console.log(`[AUTH CONTROLLER] Cart was merged during login for user ${user.id}`);
      
      // Fetch the updated cart to verify merge
      try {
        const { getOrCreateCart } = require('../services/v1/cart.service');
        const updatedCart = await getOrCreateCart(guestSessionId, user.id);
        console.log(`[AUTH CONTROLLER] Updated cart after merge has ${updatedCart.items?.length || 0} items`);
      } catch (error) {
        console.error('[AUTH CONTROLLER] Error fetching updated cart after merge:', error);
      }
    } else {
      console.log(`[AUTH CONTROLLER] No cart merge was performed for user ${user.id}`);
    }
    
    // 4. Set auth cookies
    res.cookie('refreshToken', refreshToken, {
      ...REFRESH_COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    
    // 5. Return auth response
    res.json(new AuthResponseDto(user, accessToken, refreshToken));
  } catch (err) {
    // Ensure error has status and message for the error middleware
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!refreshToken) {
      const err = new Error('No refresh token provided');
      err.status = 400;
      err.code = 'REFRESH_TOKEN_REQUIRED';
      throw err;
    }
    
    const { user, accessToken, refreshToken: newRefreshToken } = 
      await authService.refresh({ refreshToken });
      
    res.cookie('refreshToken', newRefreshToken, {
      ...REFRESH_COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json(new AuthResponseDto(user, accessToken, newRefreshToken));
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (refreshToken) {
      await authService.logout(refreshToken);
    }
    res.clearCookie('refreshToken', {
      path: '/api/v1/auth/refresh',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};