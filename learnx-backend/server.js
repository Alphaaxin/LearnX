const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const sessionRoutes = require('./routes/sessions');
const bookingRoutes = require('./routes/bookings');
const chatRoutes = require('./routes/chat');
const reviewRoutes = require('./routes/reviews');

// Import DB connection
const { sequelize } = require('./config/db');

const app = express();
const httpServer = createServer(app);

// Get the server host IP for local development
const SERVER_IP = process.env.SERVER_IP || '0.0.0.0';
const FRONTEND_URLS = [
  process.env.FRONTEND_URL || 'http://localhost:5500', 
  'http://127.0.0.1:5500',
  'http://127.0.0.1:5501',
  'http://localhost:5501',
  // Support specific local IP if used in config.js
  'http://192.168.0.127:5500',
  'http://192.168.0.127:5501',
  // Allow from any IP in the local network with any port
  /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/,
  // Widest setting - use only if needed and you understand security implications
  '*'
];

// Set up Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: FRONTEND_URLS,
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: FRONTEND_URLS,
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Add io to request object
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/reviews', reviewRoutes);

// Socket.IO chat handling
require('./utils/socket')(io);

// Connect to database and start server
const PORT = process.env.PORT || 5000;

// Sync database models
sequelize.sync()
  .then(() => {
    // Listen on all network interfaces (0.0.0.0) instead of just localhost
    httpServer.listen(PORT, SERVER_IP, () => {
      console.log(`Server running on ${SERVER_IP}:${PORT}`);
      console.log(`Access the API at http://localhost:${PORT}/api or via your local IP`);
    });
  })
  .catch(err => {
    console.error('Failed to sync database:', err);
  });

// For graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Closing HTTP server');
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
}); 