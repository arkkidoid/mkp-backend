const router = require('express').Router();
const chatController = require('../controllers/chat.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);
router.get('/conversations', chatController.getConversations);
router.post('/conversations', chatController.createConversation);
router.get('/:chatId/messages', chatController.getMessages);
router.post('/:chatId/messages', chatController.sendMessage);
router.put('/:chatId/read', chatController.markAsRead);

module.exports = router;
