const jwt = require('jsonwebtoken');
const Player = require('../models/Player');

// Protect routes - authenticate user
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from token
      req.user = await Player.findById(decoded.id);
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'No user found with this token'
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Admin only access
const adminOnly = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

// Owner or admin access
const ownerOrAdmin = (resourceOwnerField = 'owner') => {
  return (req, res, next) => {
    // If user is admin, allow access
    if (req.user.isAdmin) {
      return next();
    }

    // Check if user is the owner of the resource
    // This will be used in routes where we have the resource object
    if (req.resource && req.resource[resourceOwnerField]) {
      if (req.resource[resourceOwnerField].toString() === req.user._id.toString()) {
        return next();
      }
    }

    // If not owner and not admin, deny access
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own resources.'
    });
  };
};

module.exports = {
  protect,
  adminOnly,
  ownerOrAdmin
};