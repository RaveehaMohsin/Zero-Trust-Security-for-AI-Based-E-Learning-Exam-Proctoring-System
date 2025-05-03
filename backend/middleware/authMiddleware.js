const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  try {
    // 1. Get token from header
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        error: 'Not authorized - no token provided'
      });
    }

    // 2. Verify token
    const decoded = jwt.verify(token, 'ProctoringAI@2025$Secure'); // Use your actual secret

    // 3. Check if user still exists
    const [user] = await pool.query('SELECT * FROM users WHERE id = ?', [decoded.userId]);
    
    if (!user.length) {
      return res.status(401).json({
        error: 'Not authorized - user no longer exists'
      });
    }

    // 4. Attach user to request
    req.user = {
      id: user[0].id,
      email: user[0].email,
      role: user[0].role
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      error: 'Not authorized - token failed'
    });
  }
};

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

module.exports = {
  protect,
  authorize
};