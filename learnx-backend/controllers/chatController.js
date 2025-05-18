const { sequelize } = require('../config/db');
const { Message, User, Booking, Session } = require('../models');
const { Op } = require('sequelize');

// Send a message
exports.sendMessage = async (req, res) => {
    try {
        const { recipientId, content, tempId } = req.body;
        const senderId = req.user.id; // From auth middleware

        // Basic validation
        if (!recipientId || !content) {
            return res.status(400).json({ 
                success: false, 
                message: 'Recipient ID and message content are required' 
            });
        }

        // Check if recipient exists
        const recipient = await User.findByPk(recipientId);
        if (!recipient) {
            return res.status(404).json({ 
                success: false, 
                message: 'Recipient not found' 
            });
        }

        // Create the message
        const message = await Message.create({
            senderId,
            receiverId: recipientId,
            content,
            isRead: false
        });

        // Emit socket event for real-time update
        if (req.io) {
            const io = req.io;
            const messageData = message.toJSON();
            
            // Emit to sender
            io.to(`user_${senderId}`).emit('privateMessage', {
                ...messageData,
                tempId,
                isOwn: true
            });
            
            // Emit to recipient if they're online
            io.to(`user_${recipientId}`).emit('privateMessage', {
                ...messageData,
                tempId,
                isOwn: false
            });
            
            console.log('Emitted privateMessage events');
        }

        res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            data: message
        });

    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to send message',
            error: error.message 
        });
    }
};

// Get chat history between two users
exports.getChatHistory = async (req, res) => {
    try {
        const { recipientId } = req.params;
        const userId = req.user.id;

        const messages = await Message.findAll({
            where: {
                [Op.or]: [
                    { senderId: userId, receiverId: recipientId },
                    { senderId: recipientId, receiverId: userId }
                ]
            },
            order: [['createdAt', 'ASC']],
            include: [
                { model: User, as: 'sender', attributes: ['id', 'name', 'email', 'profileImage'] },
                { model: User, as: 'receiver', attributes: ['id', 'name', 'email', 'profileImage'] }
            ]
        });

        res.status(200).json({
            success: true,
            data: messages
        });

    } catch (error) {
        console.error('Error fetching chat history:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch chat history',
            error: error.message 
        });
    }
};

// Get user's chat contacts
exports.getChatContacts = async (req, res) => {
    try {
        const userId = req.user.id;
        
        console.log(`Fetching chat contacts for user: ${userId}`);

        // 1. Get all unique user IDs that the current user has chatted with
        console.log('Fetching sent messages...');
        const sentMessages = await Message.findAll({
            attributes: ['receiverId'],
            where: { senderId: userId },
            group: ['receiverId']
        });
        console.log('Sent messages:', JSON.stringify(sentMessages, null, 2));

        console.log('Fetching received messages...');
        const receivedMessages = await Message.findAll({
            attributes: ['senderId'],
            where: { receiverId: userId },
            group: ['senderId']
        });
        console.log('Received messages:', JSON.stringify(receivedMessages, null, 2));

        // 2. Get all unique user IDs from booked sessions
        console.log('Fetching sessions where user is teacher...');
        const sessionsAsTeacher = await Session.findAll({
            attributes: ['id'],
            where: { teacherId: userId },
            include: [{
                model: Booking,
                attributes: ['id', 'learnerId', 'status'],
                where: {
                    status: { [Op.in]: ['pending', 'confirmed', 'completed'] }
                },
                required: true
            }],
            raw: true
        });
        console.log('Sessions as teacher (raw):', JSON.stringify(sessionsAsTeacher, null, 2));

        // Get the actual learner IDs from the sessions
        const teacherLearnerIds = [...new Set(sessionsAsTeacher.map(s => s['Bookings.learnerId']))];
        console.log('Learner IDs from teacher sessions:', teacherLearnerIds);

        console.log('Fetching sessions where user is learner...');
        const sessionsAsLearner = await Booking.findAll({
            attributes: ['id', 'sessionId', 'status'],
            where: { 
                learnerId: userId,
                status: { [Op.in]: ['pending', 'confirmed', 'completed'] }
            },
            include: [{
                model: Session,
                attributes: ['id', 'teacherId'],
                required: true
            }],
            raw: true
        });
        console.log('Sessions as learner (raw):', JSON.stringify(sessionsAsLearner, null, 2));

        // Get the actual teacher IDs from the bookings
        const learnerTeacherIds = [...new Set(sessionsAsLearner.map(b => b['Session.teacherId']))];
        console.log('Teacher IDs from learner bookings:', learnerTeacherIds);
        
        // Log all booking statuses for debugging
        const allStatuses = [...sessionsAsTeacher, ...sessionsAsLearner].map(b => b.status);
        console.log('All booking statuses found:', [...new Set(allStatuses)]);

        // Combine and deduplicate all user IDs
        const messageContactIds = [
            ...sentMessages.map(m => m.receiverId),
            ...receivedMessages.map(m => m.senderId)
        ].filter(Boolean);

        console.log('Message contact IDs:', messageContactIds);
        
        // Extract contact IDs from sessions where user is teacher
        const teacherContactIds = sessionsAsTeacher
            .map(s => s['Bookings.learnerId'])
            .filter(Boolean);
            
        // Extract contact IDs from sessions where user is learner
        const learnerContactIds = sessionsAsLearner
            .map(b => b['Session.teacherId'])
            .filter(Boolean);
            
        const sessionContactIds = [...teacherContactIds, ...learnerContactIds];
        console.log('Session contact IDs:', sessionContactIds);

        // Combine and deduplicate all contact IDs
        const allContactIds = [...new Set([...messageContactIds, ...sessionContactIds])];
        console.log('All unique contact IDs:', allContactIds);

        // Debug: Check for any bookings in the database
        try {
            console.log('\n=== DEBUGGING DIRECT QUERIES ===');
            
            // Check all sessions first
            const allSessions = await Session.findAll({
                where: {
                    [Op.or]: [
                        { teacherId: userId },
                        { '$Bookings.learnerId$': userId }
                    ]
                },
                include: [{
                    model: Booking,
                    required: false
                }]
            });
            console.log('All relevant sessions:', JSON.stringify(allSessions, null, 2));
            
            // Check all bookings
            const allBookings = await Booking.findAll({
                where: {
                    [Op.or]: [
                        { learnerId: userId },
                        { '$Session.teacherId$': userId }
                    ]
                },
                include: [{
                    model: Session,
                    required: true
                }]
            });
            console.log('All bookings:', JSON.stringify(allBookings, null, 2));
            
            // Check user's own data
            const userData = await User.findByPk(userId, {
                attributes: ['id', 'name', 'email', 'role']
            });
            console.log('Current user data:', JSON.stringify(userData, null, 2));
            
            console.log('=== END DEBUGGING ===\n');
            
        } catch (dbError) {
            console.error('Error running debug queries:', dbError);
        }

        if (allContactIds.length === 0) {
            return res.status(200).json({
                success: true,
                data: []
            });
        }

        // Log the contact IDs for debugging
        console.log('All contact IDs:', allContactIds);
        console.log('Current user ID:', userId);

        // Get user details for all contacts
        const contacts = await User.findAll({
            attributes: ['id', 'name', 'email', 'profilePhoto', 'username', 'isActive'],
            where: {
                id: {
                    [Op.in]: allContactIds,
                    [Op.ne]: userId // Exclude self
                }
            },
            order: [['name', 'ASC']]
        });

        console.log('Found contacts:', contacts.map(c => ({
            id: c.id,
            name: c.name,
            username: c.username
        })));

        // Get the most recent message for each contact
        const contactsWithLastMessage = await Promise.all(
            contacts.map(async (contact) => {
                const lastMessage = await Message.findOne({
                    where: {
                        [Op.or]: [
                            { senderId: userId, receiverId: contact.id },
                            { senderId: contact.id, receiverId: userId }
                        ]
                    },
                    order: [['createdAt', 'DESC']],
                    include: [
                        { 
                            model: User, 
                            as: 'sender', 
                            attributes: ['id', 'name', 'profilePhoto', 'username'] 
                        },
                        { 
                            model: User, 
                            as: 'receiver', 
                            attributes: ['id', 'name', 'profilePhoto', 'username'] 
                        }
                    ]
                });


                return {
                    ...contact.toJSON(),
                    lastMessage: lastMessage || null
                };
            })
        );

        res.status(200).json({
            success: true,
            data: contactsWithLastMessage
        });

    } catch (error) {
        console.error('Error fetching chat contacts:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch chat contacts',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};
