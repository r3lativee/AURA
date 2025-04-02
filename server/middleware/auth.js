const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No auth token, access denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only check verification if the feature is enabled
    if (process.env.EMAIL_VERIFICATION_REQUIRED === 'true' && !user.isVerified) {
      return res.status(401).json({ message: 'Please verify your email first' });
    }

    // Store both decoded token info and full user object
    req.user = {
      _id: user._id,
      userId: user._id, // For backward compatibility
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin || false
    };
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is invalid' });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    // First apply the regular auth middleware
    auth(req, res, async () => {
      // Check if user is admin after auth passed
      if (!req.user.isAdmin) {
        return res.status(403).json({ message: 'Access denied. Admin only.' });
      }
      next();
    });
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(401).json({ message: 'Token is invalid' });
  }
};

// New middleware as an alias for adminAuth
const isAdmin = adminAuth;

module.exports = { auth, adminAuth, isAdmin };