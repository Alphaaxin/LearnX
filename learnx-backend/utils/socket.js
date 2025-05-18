const { Message, User } = require('../models');
const jwt = require('jsonwebtoken');

module.exports = (io) => {
  // Store active users
  const activeUsers = new Map(); // id -> socketId

  // Authentication middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id; // We use decoded.id from JWT as the userId for socket
      
      next();
    } catch (error) {
      console.error('Socket auth error:', error);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    
    console.log(`User connected: ${userId}`);
    
    // Join user to their own room for private messages
    socket.join(`user_${userId}`);
    
    // Add user to active users
    activeUsers.set(userId, socket.id);
    
    // Send online status to all connected clients
    io.emit('userStatus', {
      userId,
      status: 'online',
      lastSeen: new Date().toISOString()
    });
    
    // Handle private message with acknowledgment
    socket.on('privateMessage', async (data, callback) => {
      try {
        const { receiverId, content, tempId } = data;
        const senderId = userId;
        
        console.log(`Message from ${senderId} to ${receiverId}:`, content);
        
        // Acknowledge receipt of the message
        if (typeof callback === 'function') {
          callback({ status: 'received', tempId });
        }
        
        // Save message to database
        const message = await Message.create({
          senderId,
          receiverId,
          content,
          isRead: false
        });
        
        // Get sender and receiver data
        const [sender, receiver] = await Promise.all([
          User.findByPk(senderId, {
            attributes: ['id', 'name', 'username', 'profilePhoto']
          }),
          User.findByPk(receiverId, {
            attributes: ['id', 'name', 'username', 'profilePhoto']
          })
        ]);
        
        const messageData = {
          ...message.toJSON(),
          sender,
          receiver
        };
        
        // Emit message to both sender and recipient
        io.to(`user_${senderId}`).emit('privateMessage', {
          ...messageData,
          tempId,
          isOwn: true
        });
        
        // To recipient if online
        io.to(`user_${receiverId}`).emit('privateMessage', {
          ...messageData,
          tempId,
          isOwn: false
        });
        
        console.log('Emitted privateMessage via socket');
      } catch (error) {
        console.error('Error handling private message:', error);
        if (typeof callback === 'function') {
          callback({ status: 'error', message: 'Failed to send message' });
        } else {
          socket.emit('error', { message: 'Failed to send message' });
        }
      }
    });
    
    // Handle typing indicator
    socket.on('typing', (data) => {
      const { receiverId } = data;
      socket.to(`user_${receiverId}`).emit('typing', { userId });
    });
    
    // Handle stop typing
    socket.on('stopTyping', (data) => {
      const { receiverId } = data;
      socket.to(`user_${receiverId}`).emit('stopTyping', { userId });
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${userId}`);
      
      // Remove from active users
      activeUsers.delete(userId);
      
      // Send offline status to all connected clients
      io.emit('userStatus', {
        userId,
        status: 'offline',
        lastSeen: new Date().toISOString()
      });
    });
  });
}; 