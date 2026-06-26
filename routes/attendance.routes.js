const router = require('express').Router();
const {
  markAttendance, getAttendance, getChildAttendanceSummary, updateAttendance,
} = require('../controllers/attendance.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(protect);

router.route('/')
  .get(getAttendance)
  .post(authorize('teacher', 'admin'), markAttendance);

router.put('/:id', authorize('teacher', 'admin'), updateAttendance);
router.get('/child/:childId/summary', getChildAttendanceSummary);

module.exports = router;
