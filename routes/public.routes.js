const router = require('express').Router();
const publicController = require('../controllers/public.controller');

// All public — NO auth. Used by the app's "Explore School" guest section.
router.get('/courses', publicController.getCourses);
router.get('/batches', publicController.getBatches);
router.get('/gallery', publicController.getGallery);
router.get('/announcements', publicController.getAnnouncements);
router.post('/enquiry', publicController.submitEnquiry);

module.exports = router;
