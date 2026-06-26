const router = require('express').Router();
const {
  createChild, getChildren, getChild, updateChild, deleteChild, getChildProgress,
} = require('../controllers/child.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(protect);

router.route('/')
  .get(getChildren)
  .post(authorize('admin'), createChild);

router.route('/:id')
  .get(getChild)
  .put(authorize('admin'), updateChild)
  .delete(authorize('admin'), deleteChild);

router.get('/:id/progress', getChildProgress);

module.exports = router;
