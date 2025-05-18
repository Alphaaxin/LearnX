const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticate, isLearner } = require('../middlewares/auth');

// Create a new review (learner only)
router.post('/', authenticate, isLearner, reviewController.createReview);

// Get reviews for a session
router.get('/session/:sessionId', authenticate, reviewController.getSessionReviews);

// Get reviews for a teacher
router.get('/teacher/:teacherId', authenticate, reviewController.getTeacherReviews);

// Update a review
router.put('/:id', authenticate, reviewController.updateReview);

// Delete a review
router.delete('/:id', authenticate, reviewController.deleteReview);

module.exports = router; 