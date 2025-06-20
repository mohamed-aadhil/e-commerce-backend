const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();
const db = require('../models');
const { User} = db;


// Authentication middleware: verifies JWT and attaches user info to req.user
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log('--- AUTHENTICATE MIDDLEWARE ---');
  console.log('Authorization Header:', authHeader);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('No token provided or header format incorrect');
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  console.log('Extracted Access Token:', token);

  try {
    const secret = process.env.JWT_SECRET;
    console.log('JWT Secret Used:', secret);

    const decoded = jwt.verify(token, secret);
    console.log('Decoded JWT Payload:', decoded);

    // Optionally fetch user from DB if you want fresh user info
    const user = await User.findByPk(decoded.id);
    if (!user) {
      console.log('User not found for ID:', decoded.id);
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = user;
    console.log('Authenticated User:', user.id, user.email);
    next();
  } catch (err) {
    console.log('JWT verification error:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Authorization middleware: checks if user has required role
const authorize = (role) => (req, res, next) => {
  // For analytics endpoints, allow both 'admin' and 'customer' roles during development
  const isAnalyticsRoute = req.originalUrl.includes('/api/v1/analytics');
  
  if (isAnalyticsRoute && (req.user?.role === 'admin' || req.user?.role === 'customer')) {
    console.log(`Allowing ${req.user.role} access to analytics`);
    return next();
  }
  
  // For all other routes, use the original role check
  if (!req.user || req.user.role !== role) {
    console.log(`Access denied. User role: ${req.user?.role || 'none'}, Required role: ${role}`);
    return res.status(403).json({ error: 'Forbidden: insufficient privileges' });
  }
  
  next();
};

module.exports = {
  authenticate,
  authorize,
}; 