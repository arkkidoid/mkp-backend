const router = require('express').Router();
const {
  createBatch, getBatches, getBatch, updateBatch, deleteBatch, addChildToBatch, removeChildFromBatch,
} = require('../controllers/batch.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(protect);

router.route('/')
  .get(getBatches)
  .post(authorize('admin'), createBatch);

router.route('/:id')
  .get(getBatch)
  .put(authorize('admin'), updateBatch)
  .delete(authorize('admin'), deleteBatch);

router.post('/:id/add-child', authorize('admin'), addChildToBatch);
router.post('/:id/remove-child', authorize('admin'), removeChildFromBatch);

module.exports = router;
