const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// Get user profile (own or other user)
router.get('/profile/:id?', authenticate, userController.getUserProfile);

// Update user profile
router.put('/profile', authenticate, upload.single('profilePhoto'), userController.updateUserProfile);

// Get teachers (optionally filtered by skill)
router.get('/teachers', authenticate, userController.getTeachers);

module.exports = router; 