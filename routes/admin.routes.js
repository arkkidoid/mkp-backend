const router = require('express').Router();
const adminController = require('../controllers/admin.controller');
const { protect } = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/role.middleware');

router.use(protect, isAdmin);

// Enquiries (public leads from the app's guest section)
router.get('/enquiries', adminController.getEnquiries);
router.put('/enquiries/:id', adminController.updateEnquiry);
router.delete('/enquiries/:id', adminController.deleteEnquiry);

// Parents
router.get('/parents', adminController.getParents);
router.get('/parents/:id', adminController.getParent);
router.post('/parents', adminController.createParent);
router.put('/parents/:id', adminController.updateParent);
router.delete('/parents/:id', adminController.deleteParent);

// Teachers
router.get('/teachers', adminController.getTeachers);
router.get('/teachers/:id', adminController.getTeacher);
router.post('/teachers', adminController.createTeacher);
router.put('/teachers/:id', adminController.updateTeacher);
router.delete('/teachers/:id', adminController.deleteTeacher);

// Children
router.get('/children', adminController.getChildren);
router.get('/children/:id', adminController.getChild);
router.post('/children', adminController.createChild);
router.put('/children/:id', adminController.updateChild);
router.delete('/children/:id', adminController.deleteChild);

// Batches
router.get('/batches', adminController.getBatches);
router.post('/batches', adminController.createBatch);
router.put('/batches/:id', adminController.updateBatch);
router.delete('/batches/:id', adminController.deleteBatch);

// Subjects / Courses
router.get('/subjects', adminController.getSubjects);
router.post('/subjects', adminController.createSubject);
router.put('/subjects/:id', adminController.updateSubject);
router.delete('/subjects/:id', adminController.deleteSubject);

// Dashboard (also accessible from /api/admin/dashboard)
const { getAdminDashboard } = require('../controllers/dashboard.controller');
router.get('/dashboard', getAdminDashboard);

module.exports = router;
