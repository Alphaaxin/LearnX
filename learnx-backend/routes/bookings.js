const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticate, isLearner } = require('../middlewares/auth');

// Create a new booking (learner only)
router.post('/', authenticate, isLearner, bookingController.createBooking);

// Get user's bookings
router.get('/user', authenticate, bookingController.getUserBookings);

// Get bookings for teacher's sessions
router.get('/teacher', authenticate, bookingController.getTeacherBookings);

// Get booking by ID
router.get('/:id', authenticate, bookingController.getBookingById);

// Update booking status
router.put('/:id/status', authenticate, bookingController.updateBookingStatus);

// Update payment status
router.put('/:id/payment', authenticate, bookingController.updatePaymentStatus);

module.exports = router; 