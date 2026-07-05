const router = require('express').Router();
const teacherController = require('../controllers/teacher.controller');
const { protect } = require('../middleware/auth.middleware');
const { isTeacher } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validation.middleware');
const attendanceValidator = require('../validators/attendance.validator');
const assignmentValidator = require('../validators/assignment.validator');

router.use(protect, isTeacher);

// Dashboard
router.get('/dashboard', teacherController.getDashboard);

// Batches
router.get('/batches', teacherController.getMyBatches);
router.get('/batches/:id', teacherController.getBatchDetails);

// Attendance
router.post('/attendance', validate(attendanceValidator.markAttendance), teacherController.markAttendance);
router.get('/attendance/:batchId', teacherController.getAttendanceHistory);

// Assignments
router.get('/assignments', teacherController.getAssignments);
router.post('/assignments', validate(assignmentValidator.createAssignment), teacherController.createAssignment);

// Announcements
router.post('/announcements', teacherController.sendAnnouncement);

// Leave
router.get('/leave', teacherController.getLeaveHistory);
router.post('/leave', teacherController.applyLeave);

// Chat contacts
router.get('/parents', teacherController.getMyParents);

module.exports = router;
