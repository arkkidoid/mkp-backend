const router = require('express').Router();
const { getMessages, createMessage, getMessage, deleteMessage } = require('../controllers/message.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(protect);

router.route('/')
  .get(getMessages)
  .post(authorize('admin', 'teacher'), createMessage);

router.route('/:id')
  .get(getMessage)
  .delete(authorize('admin', 'teacher'), deleteMessage);

module.exports = router;
