const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

const requireAuth = async (req, res, next) => {
  const match = /^Bearer\s+(\S+)$/i.exec(req.headers.authorization || '');
  if (!match) return res.status(401).json({ message: 'Unauthorized' });
  let decoded;
  try {
    decoded = jwt.verify(match[1], process.env.JWT_SECRET);
    if (!decoded || !mongoose.isObjectIdOrHexString(decoded.id)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  } catch {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  try {
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    req.user = user;
  } catch (error) {
    return next(error);
  }
  return next();
};

const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ message: 'Unauthorized: Admin access required' });
};
module.exports = { requireAuth, requireAdmin };
