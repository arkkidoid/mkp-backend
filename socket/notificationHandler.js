const logger = require('../utils/logger');

module.exports = (io, socket) => {
  // Subscribe to batch-level notifications
  socket.on('notification:subscribe-batch', (data) => {
    const { batchId } = data;
    socket.join(`batch:${batchId}`);
    logger.debug(`User ${socket.user.name} subscribed to batch:${batchId}`);
  });

  // Unsubscribe from batch notifications
  socket.on('notification:unsubscribe-batch', (data) => {
    const { batchId } = data;
    socket.leave(`batch:${batchId}`);
  });
};

/**
 * Utility: Send real-time notification to a specific user
 * Can be called from controllers/services
 */
module.exports.sendToUser = (io, userId, event, data) => {
  io.to(`user:${userId}`).emit(event, data);
};

/**
 * Utility: Send real-time notification to all users in a batch
 */
module.exports.sendToBatch = (io, batchId, event, data) => {
  io.to(`batch:${batchId}`).emit(event, data);
};
