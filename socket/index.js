const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const chatHandler = require('./chatHandler');
const notificationHandler = require('./notificationHandler');
const logger = require('../utils/logger');

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: [
        process.env.CLIENT_URL || 'http://localhost:3000',
        process.env.ADMIN_URL || 'http://localhost:5173',
        'https://mkp-admin.vercel.app',
        'https://admin.mastikipaathshaala.org',
        'https://mastikipaathshaala.org',
        'https://www.mastikipaathshaala.org',
      ],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware for Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user || !user.isActive) {
        return next(new Error('User not found or inactive'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = String(socket.user._id);
    logger.info(`🔌 User connected: ${socket.user.name} (${socket.user.role})`);

    // Join personal room for targeted notifications
    socket.join(`user:${userId}`);

    // Register handlers
    chatHandler(io, socket);
    notificationHandler(io, socket);

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      logger.info(`🔌 User disconnected: ${socket.user.name} - ${reason}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.user.name}:`, error);
    });
  });

  logger.info('🔌 Socket.io initialized');
  return io;
};

module.exports = { initializeSocket };
