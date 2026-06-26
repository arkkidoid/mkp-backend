const router = require('express').Router();
const { getAttendanceReport, getAssignmentReport, getDashboardAnalytics } = require('../controllers/report.controller');
const { protect } = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/role.middleware');

router.use(protect, isAdmin);

router.get('/attendance', getAttendanceReport);
router.get('/assignments', getAssignmentReport);
router.get('/analytics', getDashboardAnalytics);

module.exports = router;
