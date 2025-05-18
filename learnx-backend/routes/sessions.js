const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { authenticate, isTeacher } = require('../middlewares/auth');

// Create a new session (teacher only)
router.post('/', authenticate, isTeacher, sessionController.createSession);

// Get all sessions with filters
router.get('/', authenticate, sessionController.getSessions);

// Get teacher's sessions (must come before /:id route)
router.get('/teacher/:teacherId?', authenticate, sessionController.getTeacherSessions);

// Get session by ID
router.get('/:id', authenticate, sessionController.getSessionById);

// Update session (teacher only)
router.put('/:id', authenticate, isTeacher, sessionController.updateSession);

// Delete session (teacher only)
router.delete('/:id', authenticate, isTeacher, sessionController.deleteSession);

module.exports = router; 