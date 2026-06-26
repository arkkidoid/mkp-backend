const Chat = require('../models/Chat');
const ChatMessage = require('../models/ChatMessage');
const logger = require('../utils/logger');

module.exports = (io, socket) => {
  const userId = String(socket.user._id);

  // Join all chat rooms for this user
  const joinChatRooms = async () => {
    try {
      const chats = await Chat.find({
        participants: socket.user._id,
        isActive: true,
      });

      chats.forEach((chat) => {
        socket.join(`chat:${chat._id}`);
      });

      logger.debug(`User ${socket.user.name} joined ${chats.length} chat rooms`);
    } catch (error) {
      logger.error('Error joining chat rooms:', error);
    }
  };

  joinChatRooms();

  // Handle sending a message
  socket.on('chat:send', async (data) => {
    try {
      const { chatId, content, type = 'text', mediaUrl, mediaName } = data;

      // Verify user is participant
      const chat = await Chat.findOne({
        _id: chatId,
        participants: socket.user._id,
      });

      if (!chat) {
        socket.emit('chat:error', { message: 'Chat not found' });
        return;
      }

      // Create message
      const message = await ChatMessage.create({
        chat: chatId,
        sender: socket.user._id,
        type,
        content,
        mediaUrl,
        mediaName,
      });

      // Update chat
      const unreadUpdate = {};
      chat.participants.forEach((p) => {
        if (String(p) !== userId) {
          const currentCount = chat.unreadCount.get(String(p)) || 0;
          unreadUpdate[`unreadCount.${p}`] = currentCount + 1;
        }
      });

      await Chat.findByIdAndUpdate(chatId, {
        lastMessage: message._id,
        lastMessageAt: new Date(),
        ...unreadUpdate,
      });

      // Populate and broadcast
      const populatedMessage = await ChatMessage.findById(message._id)
        .populate('sender', 'name avatar');

      io.to(`chat:${chatId}`).emit('chat:receive', populatedMessage);

      // Confirm to sender
      socket.emit('chat:sent', { messageId: message._id, chatId });
    } catch (error) {
      logger.error('Chat send error:', error);
      socket.emit('chat:error', { message: 'Failed to send message' });
    }
  });

  // Handle typing indicator
  socket.on('chat:typing', (data) => {
    const { chatId } = data;
    socket.to(`chat:${chatId}`).emit('chat:typing', {
      chatId,
      userId,
      userName: socket.user.name,
    });
  });

  // Handle stop typing
  socket.on('chat:stop-typing', (data) => {
    const { chatId } = data;
    socket.to(`chat:${chatId}`).emit('chat:stop-typing', {
      chatId,
      userId,
    });
  });

  // Handle read receipt
  socket.on('chat:read', async (data) => {
    try {
      const { chatId } = data;

      // Mark messages as read
      await ChatMessage.updateMany(
        {
          chat: chatId,
          sender: { $ne: socket.user._id },
          'readBy.user': { $ne: socket.user._id },
        },
        {
          $push: {
            readBy: { user: socket.user._id, readAt: new Date() },
          },
        }
      );

      // Reset unread count
      await Chat.findByIdAndUpdate(chatId, {
        [`unreadCount.${userId}`]: 0,
      });

      // Notify other participants
      socket.to(`chat:${chatId}`).emit('chat:read', {
        chatId,
        userId,
      });
    } catch (error) {
      logger.error('Chat read error:', error);
    }
  });

  // Join a specific chat room (for new conversations)
  socket.on('chat:join', (data) => {
    const { chatId } = data;
    socket.join(`chat:${chatId}`);
  });
};
