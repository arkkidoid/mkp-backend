const router = require('express').Router();
const { getFees, createFee, getFee, updateFee, recordPayment, getPaymentHistory } = require('../controllers/fee.controller');
const { protect } = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/role.middleware');

router.use(protect);

router.route('/')
  .get(getFees)
  .post(isAdmin, createFee);

router.get('/payments', getPaymentHistory);

router.route('/:id')
  .get(getFee)
  .put(isAdmin, updateFee);

router.post('/:id/payment', isAdmin, recordPayment);

module.exports = router;
