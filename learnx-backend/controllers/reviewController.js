const { Review, Booking, Session, User } = require('../models');

// Create a new review
const createReview = async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;
    const reviewerId = req.user.id;
    
    if (!bookingId || !rating) {
      return res.status(400).json({ message: 'Booking ID and rating are required' });
    }
    
    // Check if booking exists and is completed
    const booking = await Booking.findByPk(bookingId, {
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
    
    if (booking.status !== 'completed') {
      return res.status(400).json({ message: 'You can only review completed sessions' });
    }
    
    // Check if user is the learner of this booking
    if (booking.learnerId !== reviewerId) {
      return res.status(403).json({ message: 'You can only review sessions you have booked' });
    }
    
    // Check if review already exists
    const existingReview = await Review.findOne({
      where: { bookingId }
    });
    
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this session' });
    }
    
    // Create review
    const review = await Review.create({
      reviewerId,
      bookingId,
      sessionId: booking.sessionId,
      rating,
      comment
    });
    
    res.status(201).json({
      message: 'Review submitted successfully',
      review
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Failed to submit review', error: error.message });
  }
};

// Get reviews for a session
const getSessionReviews = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const reviews = await Review.findAll({
      where: { sessionId },
      include: [
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'name', 'username', 'profilePhoto']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    // Calculate average rating
    let totalRating = 0;
    reviews.forEach(review => {
      totalRating += review.rating;
    });
    
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;
    
    res.status(200).json({
      reviews,
      averageRating,
      totalReviews: reviews.length
    });
  } catch (error) {
    console.error('Get session reviews error:', error);
    res.status(500).json({ message: 'Failed to get reviews', error: error.message });
  }
};

// Get reviews for a teacher
const getTeacherReviews = async (req, res) => {
  try {
    const { teacherId } = req.params;
    
    // Get all sessions by this teacher
    const sessions = await Session.findAll({
      where: { teacherId },
      attributes: ['id']
    });
    
    const sessionIds = sessions.map(session => session.id);
    
    // Get reviews for these sessions
    const reviews = await Review.findAll({
      where: { sessionId: sessionIds },
      include: [
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'name', 'username', 'profilePhoto']
        },
        {
          model: Session,
          attributes: ['id', 'title', 'skill']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    // Calculate average rating
    let totalRating = 0;
    reviews.forEach(review => {
      totalRating += review.rating;
    });
    
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;
    
    res.status(200).json({
      reviews,
      averageRating,
      totalReviews: reviews.length
    });
  } catch (error) {
    console.error('Get teacher reviews error:', error);
    res.status(500).json({ message: 'Failed to get reviews', error: error.message });
  }
};

// Update a review
const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;
    
    // Check if review exists
    const review = await Review.findByPk(id);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Check if user is the reviewer
    if (review.reviewerId !== userId) {
      return res.status(403).json({ message: 'You can only update your own reviews' });
    }
    
    // Update review
    if (rating) review.rating = rating;
    if (comment !== undefined) review.comment = comment;
    
    await review.save();
    
    res.status(200).json({
      message: 'Review updated successfully',
      review
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ message: 'Failed to update review', error: error.message });
  }
};

// Delete a review
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if review exists
    const review = await Review.findByPk(id);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Check if user is the reviewer
    if (review.reviewerId !== userId) {
      return res.status(403).json({ message: 'You can only delete your own reviews' });
    }
    
    // Delete review
    await review.destroy();
    
    res.status(200).json({
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ message: 'Failed to delete review', error: error.message });
  }
};

module.exports = {
  createReview,
  getSessionReviews,
  getTeacherReviews,
  updateReview,
  deleteReview
}; 