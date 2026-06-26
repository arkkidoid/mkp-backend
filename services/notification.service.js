const logger = require('../utils/logger');
const Notification = require('../models/Notification');

class NotificationService {
  static async sendPush(fcmTokens, title, body, data = {}) {
    // Push notifications disabled — will integrate fast2sms/FCM later
    logger.debug(`[PUSH STUB] To: ${fcmTokens?.length || 0} device(s) | ${title}: ${body}`);
  }

  static async createNotification({ recipientId, title, body, type, data = {}, senderId = null }) {
    const notification = await Notification.create({
      recipient: recipientId,
      title,
      body,
      type,
      data,
      sender: senderId,
    });
    logger.debug(`[NOTIFICATION] ${type} → ${recipientId}: ${title}`);
    return notification;
  }

  static async sendBulkNotification({ recipientIds, title, body, type, data = {}, senderId = null }) {
    return Promise.all(
      recipientIds.map((id) =>
        this.createNotification({ recipientId: id, title, body, type, data, senderId })
      )
    );
  }
}

module.exports = NotificationService;
