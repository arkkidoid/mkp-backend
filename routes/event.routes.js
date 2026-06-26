const router = require('express').Router();
const eventController = require('../controllers/event.controller');
const { protect } = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/role.middleware');

router.use(protect);
router.get('/', eventController.getEvents);
router.post('/', isAdmin, eventController.createEvent);
router.put('/:id', isAdmin, eventController.updateEvent);
router.delete('/:id', isAdmin, eventController.deleteEvent);

module.exports = router;
