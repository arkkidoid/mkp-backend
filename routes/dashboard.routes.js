const router = require('express').Router();
const { getAdminDashboard } = require('../controllers/dashboard.controller');
const { protect } = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/role.middleware');

router.use(protect);
router.get('/admin', isAdmin, getAdminDashboard);

module.exports = router;
