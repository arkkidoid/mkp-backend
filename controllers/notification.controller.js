const Notification = require('../models/Notification');
const User = require('../models/User');
const NotificationService = require('../services/notification.service');
const ApiResponse = require('../utils/apiResponse');
const { getPaginationOptions } = require('../utils/helpers');

/**
 * @desc    Admin: Broadcast notification
 * @route   POST /api/notifications
 */
const sendNotification = async (req, res, next) => {
  try {
    const { title, body, targetRole } = req.body;
    
    let filter = { isActive: true };
    if (targetRole === 'parent') filter.role = 'parent';
    else if (targetRole === 'teacher') filter.role = 'teacher';
    else if (targetRole === 'all') filter.role = { $in: ['parent', 'teacher'] };
    
    const users = await User.find(filter).select('_id');
    const recipientIds = users.map(u => u._id);

    if (recipientIds.length > 0) {
      await NotificationService.sendBulkNotification({
        recipientIds,
        title,
        body,
        type: 'general',
        senderId: req.user._id,
      });

      const io = req.app.get('io');
      if (io) {
        users.forEach(u => {
          io.to(`user:${u._id}`).emit('notification:new', {
            title,
            body,
            type: 'general',
            createdAt: new Date(),
          });
        });
      }
    }

    return ApiResponse.success(res, { message: `Notification sent to ${recipientIds.length} users` });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user's notifications
 * @route   GET /api/notifications
 */
const getNotifications = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationOptions(req.query);
    const filter = {
      recipient: req.user._id,
      ...(req.query.isRead !== undefined && { isRead: req.query.isRead === 'true' }),
      ...(req.query.type && { type: req.query.type }),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .populate('sender', 'name avatar')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit),
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipient: req.user._id, isRead: false }),
    ]);

    return ApiResponse.paginated(res, {
      data: notifications,
      page,
      limit,
      total,
      message: 'Success',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark notification as read
 * @route   PUT /api/notifications/:id/read
 */
const markAsRead = async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true, readAt: new Date() }
    );
    return ApiResponse.success(res, { message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/notifications/read-all
 */
const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    return ApiResponse.success(res, { message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get unread notification count
 * @route   GET /api/notifications/unread-count
 */
const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });
    return ApiResponse.success(res, { data: { count } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
};
