const authService = require('../services/authService');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }
    const decoded = authService.verifyToken(token);
    req.user = decoded; // Attach { id, email } to req.user
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      message: error.message || 'Invalid or expired token',
    });
  }
};

module.exports = authMiddleware;