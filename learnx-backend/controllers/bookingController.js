const { Booking, Session, User } = require('../models');
const { Op } = require('sequelize');

// Create a new booking
const createBooking = async (req, res) => {
  try {
    const { sessionId, notes } = req.body;
    const learnerId = req.user.id;
    
    // Check if session exists
    const session = await Session.findByPk(sessionId);
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    // Check if session is active
    if (!session.isActive) {
      return res.status(400).json({ message: 'This session is no longer available' });
    }
    
    // Check if user is not booking their own session
    if (session.teacherId === learnerId) {
      return res.status(400).json({ message: 'You cannot book your own session' });
    }
    
    // Check if user already has a booking for this session
    const existingBooking = await Booking.findOne({
      where: {
        sessionId,
        learnerId,
        status: {
          [Op.notIn]: ['cancelled']
        }
      }
    });
    
    if (existingBooking) {
      return res.status(400).json({ message: 'You have already booked this session' });
    }
    
    // Check if session is full
    const bookingCount = await Booking.count({
      where: {
        sessionId,
        status: {
          [Op.in]: ['pending', 'confirmed']
        }
      }
    });
    
    if (bookingCount >= session.maxParticipants) {
      return res.status(400).json({ message: 'This session is already full' });
    }
    
    // Set payment status based on exchange type
    const paymentStatus = session.exchangeType === 'barter' ? 'not_applicable' : 'unpaid';
    
    // Create booking
    const booking = await Booking.create({
      sessionId,
      learnerId,
      notes,
      status: 'pending',
      paymentStatus
    });
    
    res.status(201).json({
      message: 'Booking created successfully',
      booking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Failed to create booking', error: error.message });
  }
};

// Get user's bookings
const getUserBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const bookings = await Booking.findAll({
      where: { learnerId: userId },
      include: [
        {
          model: Session,
          include: [
            {
              model: User,
              as: 'teacher',
              attributes: ['id', 'name', 'username', 'profilePhoto']
            }
          ]
        }
      ],
      order: [
        [Session, 'date', 'ASC'],
        [Session, 'startTime', 'ASC']
      ]
    });
    
    res.status(200).json({ bookings });
  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({ message: 'Failed to get bookings', error: error.message });
  }
};

// Get bookings for teacher's sessions
const getTeacherBookings = async (req, res) => {
  try {
    const teacherId = req.user.id;
    
    const bookings = await Booking.findAll({
      include: [
        {
          model: Session,
          where: { teacherId },
          include: [
            {
              model: User,
              as: 'teacher',
              attributes: ['id', 'name', 'username']
            }
          ]
        },
        {
          model: User,
          as: 'learner',
          attributes: ['id', 'name', 'username', 'profilePhoto']
        }
      ],
      order: [
        [Session, 'date', 'ASC'],
        [Session, 'startTime', 'ASC']
      ]
    });
    
    res.status(200).json({ bookings });
  } catch (error) {
    console.error('Get teacher bookings error:', error);
    res.status(500).json({ message: 'Failed to get bookings', error: error.message });
  }
};

// Update booking status
const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;
    
    // Check if booking exists
    const booking = await Booking.findByPk(id, {
      include: [
        {
          model: Session,
          include: [
            {
              model: User,
              as: 'teacher',
              attributes: ['id']
            }
          ]
        }
      ]
    });
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Check if user is authorized to update this booking
    const isTeacher = booking.Session.teacherId === userId;
    const isLearner = booking.learnerId === userId;
    
    if (!isTeacher && !isLearner) {
      return res.status(403).json({ message: 'Not authorized to update this booking' });
    }
    
    // Validate status change permissions
    if (status === 'confirmed' && !isTeacher) {
      return res.status(403).json({ message: 'Only the teacher can confirm bookings' });
    }
    
    if (status === 'completed' && !isTeacher) {
      return res.status(403).json({ message: 'Only the teacher can mark bookings as completed' });
    }
    
    // Update booking status
    booking.status = status;
    await booking.save();
    
    res.status(200).json({
      message: 'Booking status updated successfully',
      booking
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ message: 'Failed to update booking status', error: error.message });
  }
};

// Update payment status
const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus, paymentId } = req.body;
    
    // Check if booking exists
    const booking = await Booking.findByPk(id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Update payment status
    booking.paymentStatus = paymentStatus;
    if (paymentId) booking.paymentId = paymentId;
    await booking.save();
    
    res.status(200).json({
      message: 'Payment status updated successfully',
      booking
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ message: 'Failed to update payment status', error: error.message });
  }
};

// Get booking by ID
const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const booking = await Booking.findByPk(id, {
      include: [
        {
          model: Session,
          include: [
            {
              model: User,
              as: 'teacher',
              attributes: ['id', 'name', 'username', 'profilePhoto']
            }
          ]
        },
        {
          model: User,
          as: 'learner',
          attributes: ['id', 'name', 'username', 'profilePhoto']
        }
      ]
    });
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Check if user is authorized to view this booking
    const isTeacher = booking.Session.teacherId === userId;
    const isLearner = booking.learnerId === userId;
    
    if (!isTeacher && !isLearner) {
      return res.status(403).json({ message: 'Not authorized to view this booking' });
    }
    
    res.status(200).json({ booking });
  } catch (error) {
    console.error('Get booking by ID error:', error);
    res.status(500).json({ message: 'Failed to get booking', error: error.message });
  }
};

module.exports = {
  createBooking,
  getUserBookings,
  getTeacherBookings,
  updateBookingStatus,
  updatePaymentStatus,
  getBookingById
}; 