const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// Register new user
router.post('/register', upload.single('profilePhoto'), authController.register);

// Login user
router.post('/login', authController.login);

// Logout user
router.post('/logout', authController.logout);

// Get current user
router.get('/me', authenticate, authController.getCurrentUser);

// Change password
router.post('/change-password', authenticate, authController.changePassword);

module.exports = router; 