const Chat = require('../models/Chat');
const ChatMessage = require('../models/ChatMessage');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const { getPaginationOptions } = require('../utils/helpers');

/**
 * @desc    Get user's chat conversations
 * @route   GET /api/chat/conversations
 */
const getConversations = async (req, res, next) => {
  try {
    const conversations = await Chat.find({
      participants: req.user._id,
      isActive: true,
    })
      .populate('participants', 'name avatar role')
      .populate('child', 'name class photo')
      .populate({
        path: 'lastMessage',
        select: 'content type createdAt sender',
        populate: { path: 'sender', select: 'name' },
      })
      .sort('-lastMessageAt');

    // Attach unread count for current user
    const conversationsWithUnread = conversations.map((chat) => {
      const chatObj = chat.toObject();
      chatObj.myUnreadCount = chat.unreadCount.get(String(req.user._id)) || 0;
      return chatObj;
    });

    return ApiResponse.success(res, { data: conversationsWithUnread });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get or create a chat conversation
 * @route   POST /api/chat/conversations
 */
const createConversation = async (req, res, next) => {
  try {
    const { participantId, childId } = req.body;

    // Check if conversation already exists
    let chat = await Chat.findOne({
      participants: { $all: [req.user._id, participantId] },
      ...(childId && { child: childId }),
    });

    if (!chat) {
      chat = await Chat.create({
        participants: [req.user._id, participantId],
        child: childId,
      });
    }

    const populatedChat = await Chat.findById(chat._id)
      .populate('participants', 'name avatar role')
      .populate('child', 'name class photo');

    return ApiResponse.success(res, { data: populatedChat });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get chat messages
 * @route   GET /api/chat/:chatId/messages
 */
const getMessages = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { page, limit, skip } = getPaginationOptions(req.query);

    // Verify user is participant
    const chat = await Chat.findOne({
      _id: chatId,
      participants: req.user._id,
    });
    if (!chat) throw ApiError.notFound('Chat not found');

    const [messages, total] = await Promise.all([
      ChatMessage.find({ chat: chatId, isDeleted: false })
        .populate('sender', 'name avatar')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit),
      ChatMessage.countDocuments({ chat: chatId, isDeleted: false }),
    ]);

    return ApiResponse.paginated(res, {
      data: messages.reverse(), // Return in chronological order
      page,
      limit,
      total,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Send a message (REST fallback)
 * @route   POST /api/chat/:chatId/messages
 */
const sendMessage = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { content, type, mediaUrl, mediaName } = req.body;

    const chat = await Chat.findOne({
      _id: chatId,
      participants: req.user._id,
    });
    if (!chat) throw ApiError.notFound('Chat not found');

    const message = await ChatMessage.create({
      chat: chatId,
      sender: req.user._id,
      content,
      type: type || 'text',
      mediaUrl,
      mediaName,
    });

    // Update chat's last message
    const unreadUpdate = {};
    chat.participants.forEach((p) => {
      if (String(p) !== String(req.user._id)) {
        const currentCount = chat.unreadCount.get(String(p)) || 0;
        unreadUpdate[`unreadCount.${p}`] = currentCount + 1;
      }
    });

    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: message._id,
      lastMessageAt: new Date(),
      ...unreadUpdate,
    });

    const populatedMessage = await ChatMessage.findById(message._id)
      .populate('sender', 'name avatar');

    // Emit via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(`chat:${chatId}`).emit('chat:receive', populatedMessage);
    }

    return ApiResponse.created(res, { data: populatedMessage });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark messages as read
 * @route   PUT /api/chat/:chatId/read
 */
const markAsRead = async (req, res, next) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findOne({
      _id: chatId,
      participants: req.user._id,
    });
    if (!chat) throw ApiError.notFound('Chat not found');

    // Mark all unread messages as read
    await ChatMessage.updateMany(
      {
        chat: chatId,
        sender: { $ne: req.user._id },
        'readBy.user': { $ne: req.user._id },
      },
      {
        $push: {
          readBy: { user: req.user._id, readAt: new Date() },
        },
      }
    );

    // Reset unread count
    chat.unreadCount.set(String(req.user._id), 0);
    await chat.save();

    // Emit read receipt
    const io = req.app.get('io');
    if (io) {
      io.to(`chat:${chatId}`).emit('chat:read', {
        chatId,
        userId: req.user._id,
      });
    }

    return ApiResponse.success(res, { message: 'Messages marked as read' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConversations,
  createConversation,
  getMessages,
  sendMessage,
  markAsRead,
};
