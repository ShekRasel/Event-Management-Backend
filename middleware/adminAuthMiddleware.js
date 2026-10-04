const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

exports.protectAdmin = async (req, res, next) => {
  const match = /^Bearer\s+(\S+)$/i.exec(req.headers.authorization || '');
  if (!match) return res.status(401).json({ msg: 'Not authorized, no token' });
  let decoded;
  try {
    decoded = jwt.verify(match[1], process.env.JWT_SECRET);
    if (!decoded.admin || !mongoose.isObjectIdOrHexString(decoded.admin.id)) {
      return res.status(401).json({ msg: 'Not authorized, token failed' });
    }
  } catch {
    return res.status(401).json({ msg: 'Not authorized, token failed' });
  }
  try {
    const admin = await Admin.findById(decoded.admin.id).select('-password');
    if (!admin || admin.role !== 'admin') {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    req.admin = admin;
  } catch (error) {
    return next(error);
  }
  return next();
};
