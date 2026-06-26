const router = require('express').Router();
const { getGallery, createGallery, deleteGallery } = require('../controllers/gallery.controller');
const { protect } = require('../middleware/auth.middleware');
const { isAdminOrTeacher } = require('../middleware/role.middleware');

router.use(protect);
router.get('/', getGallery);
router.post('/', isAdminOrTeacher, createGallery);
router.delete('/:id', isAdminOrTeacher, deleteGallery);

module.exports = router;
