const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Middleware to verify JWT token
const authenticate = async (req, res, next) => {
  try {
    // Get token from header or cookie
    const token = req.cookies.token || 
                  req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user by id
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Add user to request object
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

// Middleware to check if user is a teacher
const isTeacher = (req, res, next) => {
  if (req.user.role === 'teacher' || req.user.role === 'both') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Teacher role required.' });
  }
};

// Middleware to check if user is a learner
const isLearner = (req, res, next) => {
  if (req.user.role === 'learner' || req.user.role === 'both') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Learner role required.' });
  }
};

module.exports = {
  authenticate,
  isTeacher,
  isLearner
}; 