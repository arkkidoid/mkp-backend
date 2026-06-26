const router = require('express').Router();
const notificationController = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);
router.post('/', notificationController.sendNotification);
router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.put('/read-all', notificationController.markAllAsRead);
router.put('/:id/read', notificationController.markAsRead);

module.exports = router;
