const jwt = require('jsonwebtoken');
const { User } = require('../models/user/User');

// Authentication middleware: verifies JWT and attaches user info to req.user
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Optionally fetch user from DB if you want fresh user info
    req.user = decoded; // or await User.findByPk(decoded.id)
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Authorization middleware: checks if user has required role
const authorize = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) {
    return res.status(403).json({ error: 'Forbidden: insufficient privileges' });
  }
  next();
};

module.exports = {
  authenticate,
  authorize,
}; 