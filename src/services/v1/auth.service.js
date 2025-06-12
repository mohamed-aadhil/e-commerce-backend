const bcrypt = require('bcrypt');
const { generateAccessToken, generateRefreshToken, getRefreshTokenExpiryDate, verifyRefreshToken } = require('../../utils/token.util');
const User = require('../../models/user/User');
const RefreshToken = require('../../models/user/RefreshToken');
const { Op } = require('sequelize');

const SALT_ROUNDS = 10;

async function register({ name, email, password }) {
  console.log('[AUTH SERVICE] Register called with:', { name, email });
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    const error = new Error('Email already registered');
    error.status = 409;
    throw error;
  }
  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ name, email, password_hash });
  console.log('[AUTH SERVICE] User registered:', user.id);
  return user;
}

async function login({ email, password }) {
  console.log('[AUTH SERVICE] Login called with:', { email });
  const user = await User.findOne({ where: { email } });
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
  const accessToken = generateAccessToken({ id: user.id, role: user.role, name: user.name });
  const refreshToken = generateRefreshToken({ id: user.id });
  const expires_at = getRefreshTokenExpiryDate();
  await RefreshToken.create({ user_id: user.id, token: refreshToken, expires_at });
  console.log('[AUTH SERVICE] Login successful for user:', user.id);
  return { user, accessToken, refreshToken };
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