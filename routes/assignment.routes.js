const router = require('express').Router();
const {
  createAssignment, getAssignments, getAssignment, updateAssignment, deleteAssignment, getSubmissions,
} = require('../controllers/assignment.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(protect);

router.route('/')
  .get(getAssignments)
  .post(authorize('teacher', 'admin'), createAssignment);

router.route('/:id')
  .get(getAssignment)
  .put(authorize('teacher', 'admin'), updateAssignment)
  .delete(authorize('teacher', 'admin'), deleteAssignment);

router.get('/:id/submissions', authorize('teacher', 'admin'), getSubmissions);

module.exports = router;
