const authService = require('../../services/v1/auth.service');
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
    const { user, accessToken, refreshToken } = await authService.register(req.body);
    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      ...REFRESH_COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    res.status(201).json(new AuthResponseDto(user, accessToken, refreshToken));
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { user, accessToken, refreshToken } = await authService.login(req.body);
    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      ...REFRESH_COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    res.json(new AuthResponseDto(user, accessToken, refreshToken));
  } catch (err) {
    next(err);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!refreshToken) throw new Error('No refresh token provided');
    const { user, accessToken, refreshToken: newRefreshToken } = await authService.refresh({ refreshToken });
    res.cookie('refreshToken', newRefreshToken, {
      ...REFRESH_COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json(new AuthResponseDto(user, accessToken, newRefreshToken));
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!refreshToken) throw new Error('No refresh token provided');
    await authService.logout({ refreshToken });
    res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);
    res.json({ message: 'Logged out' });
  } catch (err) {
    next(err);
  }
}; 