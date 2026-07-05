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
    const { title, body, targetRole, targetUserId } = req.body;

    let recipientIds = [];

    if (targetUserId) {
      // Targeted: specific user
      recipientIds = [targetUserId];
    } else {
      let filter = { isActive: true, role: { $in: ['parent', 'teacher'] } };
      if (targetRole === 'parent') filter.role = 'parent';
      else if (targetRole === 'teacher') filter.role = 'teacher';
      const users = await User.find(filter).select('_id');
      recipientIds = users.map(u => u._id);
    }

    if (recipientIds.length > 0) {
      await NotificationService.sendBulkNotification({
        recipientIds,
        title,
        body,
        type: req.body.type || 'general',
        senderId: req.user._id,
      });

      const io = req.app.get('io');
      if (io) {
        recipientIds.forEach(uid => {
          io.to(`user:${uid}`).emit('notification:new', {
            title, body, type: req.body.type || 'general', createdAt: new Date(),
          });
        });
      }
    }

    return ApiResponse.success(res, { message: `Notification sent to ${recipientIds.length} user(s)` });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user's notifications or Admin's sent history
 * @route   GET /api/notifications
 */
const getNotifications = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationOptions(req.query);
    
    // Admin sees sent history
    if (req.user.role === 'admin') {
      const sentNotifications = await Notification.aggregate([
        { $match: { sender: req.user._id } },
        { 
          $group: {
            _id: { title: "$title", body: "$body" },
            createdAt: { $max: "$createdAt" },
            type: { $first: "$type" },
            count: { $sum: 1 }
          }
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit }
      ]);
      
      const formattedData = sentNotifications.map(n => ({
        _id: n._id.title + n._id.body, 
        title: n._id.title,
        body: n._id.body,
        type: n.type,
        createdAt: n.createdAt,
        recipientsCount: n.count
      }));

      const totalGrouped = await Notification.aggregate([
        { $match: { sender: req.user._id } },
        { $group: { _id: { title: "$title", body: "$body" } } },
        { $count: "total" }
      ]);

      return ApiResponse.paginated(res, {
        data: formattedData,
        page,
        limit,
        total: totalGrouped[0]?.total || 0,
        message: 'Success',
      });
    }

    // Normal users see received notifications
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
