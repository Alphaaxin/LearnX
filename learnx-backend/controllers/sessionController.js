const { Session, User, Booking } = require('../models');
const { Op } = require('sequelize');

// Create a new session
const createSession = async (req, res) => {
  try {
    const {
      title,
      description,
      skill,
      date,
      startTime,
      endTime,
      sessionMode,
      exchangeType,
      price,
      barterSkill,
      location,
      maxParticipants
    } = req.body;
    
    // Validate required fields
    if (!title || !description || !skill || !date || !startTime || !endTime || !sessionMode || !exchangeType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Validate exchange type specific fields
    if (exchangeType === 'paid' && !price) {
      return res.status(400).json({ message: 'Price is required for paid sessions' });
    }
    
    if (exchangeType === 'barter' && !barterSkill) {
      return res.status(400).json({ message: 'Barter skill is required for barter sessions' });
    }
    
    // Validate location for in-person sessions
    if (sessionMode === 'in-person' && !location) {
      return res.status(400).json({ message: 'Location is required for in-person sessions' });
    }
    
    // Create session
    const session = await Session.create({
      title,
      description,
      skill,
      date,
      startTime,
      endTime,
      sessionMode,
      exchangeType,
      price: exchangeType === 'paid' ? price : null,
      barterSkill: exchangeType === 'barter' ? barterSkill : null,
      location: sessionMode === 'in-person' ? location : null,
      maxParticipants: maxParticipants || 1,
      teacherId: req.user.id
    });
    
    res.status(201).json({
      message: 'Session created successfully',
      session
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ message: 'Failed to create session', error: error.message });
  }
};

// Get all sessions with filters
const getSessions = async (req, res) => {
  try {
    const {
      skill,
      date,
      sessionMode,
      exchangeType,
      teacherId,
      barterSkill
    } = req.query;
    
    // Build where clause based on filters
    const whereClause = { isActive: true };
    
    if (skill) whereClause.skill = skill;
    if (date) whereClause.date = date;
    if (sessionMode) whereClause.sessionMode = sessionMode;
    if (exchangeType) whereClause.exchangeType = exchangeType;
    if (teacherId) whereClause.teacherId = teacherId;
    if (barterSkill) whereClause.barterSkill = barterSkill;
    
    // Only show future sessions
    whereClause.date = {
      [Op.gte]: new Date().toISOString().split('T')[0]
    };
    
    // Get sessions with teacher info
    const sessions = await Session.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'name', 'username', 'profilePhoto']
        }
      ],
      order: [
        ['date', 'ASC'],
        ['startTime', 'ASC']
      ]
    });
    
    res.status(200).json({ sessions });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ message: 'Failed to get sessions', error: error.message });
  }
};

// Get session by ID
const getSessionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const session = await Session.findByPk(id, {
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'name', 'username', 'profilePhoto', 'bio']
        },
        {
          model: Booking,
          attributes: ['id', 'status', 'learnerId']
        }
      ]
    });
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    res.status(200).json({ session });
  } catch (error) {
    console.error('Get session by ID error:', error);
    res.status(500).json({ message: 'Failed to get session', error: error.message });
  }
};

// Update session
const updateSession = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await Session.findByPk(id);
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    // Check if user is the teacher
    if (session.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this session' });
    }
    
    // Update fields
    const {
      title,
      description,
      skill,
      date,
      startTime,
      endTime,
      sessionMode,
      exchangeType,
      price,
      barterSkill,
      location,
      maxParticipants,
      isActive
    } = req.body;
    
    if (title) session.title = title;
    if (description) session.description = description;
    if (skill) session.skill = skill;
    if (date) session.date = date;
    if (startTime) session.startTime = startTime;
    if (endTime) session.endTime = endTime;
    if (sessionMode) session.sessionMode = sessionMode;
    if (exchangeType) session.exchangeType = exchangeType;
    if (price && exchangeType === 'paid') session.price = price;
    if (barterSkill && exchangeType === 'barter') session.barterSkill = barterSkill;
    if (location && sessionMode === 'in-person') session.location = location;
    if (maxParticipants) session.maxParticipants = maxParticipants;
    if (isActive !== undefined) session.isActive = isActive;
    
    await session.save();
    
    res.status(200).json({
      message: 'Session updated successfully',
      session
    });
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({ message: 'Failed to update session', error: error.message });
  }
};

// Delete session
const deleteSession = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await Session.findByPk(id);
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    // Check if user is the teacher
    if (session.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this session' });
    }
    
    // Check if session has bookings
    const bookings = await Booking.findAll({
      where: {
        sessionId: id,
        status: {
          [Op.in]: ['confirmed', 'pending']
        }
      }
    });
    
    if (bookings.length > 0) {
      // Set session as inactive instead of deleting
      session.isActive = false;
      await session.save();
      
      return res.status(200).json({
        message: 'Session has bookings and cannot be deleted. It has been marked as inactive.',
        session
      });
    }
    
    // Delete session
    await session.destroy();
    
    res.status(200).json({
      message: 'Session deleted successfully'
    });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ message: 'Failed to delete session', error: error.message });
  }
};

// Get teacher's sessions
const getTeacherSessions = async (req, res) => {
  try {
    const teacherId = req.params.teacherId || req.user.id;
    
    const sessions = await Session.findAll({
      where: { teacherId },
      include: [
        {
          model: Booking,
          attributes: ['id', 'status', 'learnerId']
        }
      ],
      order: [
        ['date', 'ASC'],
        ['startTime', 'ASC']
      ]
    });
    
    res.status(200).json({ sessions });
  } catch (error) {
    console.error('Get teacher sessions error:', error);
    res.status(500).json({ message: 'Failed to get teacher sessions', error: error.message });
  }
};

module.exports = {
  createSession,
  getSessions,
  getSessionById,
  updateSession,
  deleteSession,
  getTeacherSessions
}; 