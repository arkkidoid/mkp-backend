const router = require('express').Router();
const parentController = require('../controllers/parent.controller');
const { protect } = require('../middleware/auth.middleware');
const { isParent } = require('../middleware/role.middleware');

router.use(protect, isParent);

router.get('/dashboard', parentController.getDashboard);
router.get('/children', parentController.getMyChildren);
router.get('/attendance/:childId', parentController.getChildAttendance);
router.get('/assignments/:childId', parentController.getChildAssignments);
router.get('/fees/:childId', parentController.getChildFees);
router.get('/gallery', parentController.getGallery);
router.get('/messages', parentController.getMessages);

module.exports = router;
