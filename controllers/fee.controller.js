const Fee = require('../models/Fee');
const Payment = require('../models/Payment');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const { getPaginationOptions } = require('../utils/helpers');

const getFees = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationOptions(req.query);
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.childId) filter.child = req.query.childId;
    if (req.query.parentId) filter.parent = req.query.parentId;
    if (req.query.feeType) filter.feeType = req.query.feeType;

    const [fees, total] = await Promise.all([
      Fee.find(filter)
        .populate('child', 'name class')
        .populate('parent', 'name phone')
        .sort('-dueDate').skip(skip).limit(limit),
      Fee.countDocuments(filter),
    ]);
    return ApiResponse.paginated(res, { data: fees, page, limit, total });
  } catch (error) { next(error); }
};

const createFee = async (req, res, next) => {
  try {
    const { amount, discount = 0, ...rest } = req.body;
    const fee = await Fee.create({ ...rest, amount, discount, finalAmount: amount - discount });
    return ApiResponse.created(res, { message: 'Fee created', data: fee });
  } catch (error) { next(error); }
};

const getFee = async (req, res, next) => {
  try {
    const fee = await Fee.findById(req.params.id)
      .populate('child', 'name class')
      .populate('parent', 'name phone email');
    if (!fee) throw ApiError.notFound('Fee record not found');
    return ApiResponse.success(res, { data: fee });
  } catch (error) { next(error); }
};

const updateFee = async (req, res, next) => {
  try {
    const fee = await Fee.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });
    if (!fee) throw ApiError.notFound('Fee record not found');
    return ApiResponse.success(res, { message: 'Fee updated', data: fee });
  } catch (error) { next(error); }
};

const recordPayment = async (req, res, next) => {
  try {
    const fee = await Fee.findById(req.params.id);
    if (!fee) throw ApiError.notFound('Fee record not found');

    const { amount, paymentMode = 'cash', transactionId, notes } = req.body;

    const payment = await Payment.create({
      fee: fee._id,
      parent: fee.parent,
      amount,
      paymentMethod: ['cash','cheque','bank_transfer'].includes(paymentMode) ? paymentMode : 'online',
      transactionId,
      remarks: notes,
      paidAt: new Date(),
      status: 'success',
    });

    // Update fee status
    fee.paidAmount = (fee.paidAmount || 0) + amount;
    fee.paidDate = new Date();
    fee.status = fee.paidAmount >= fee.finalAmount ? 'paid' : 'partial';
    await fee.save();

    return ApiResponse.created(res, { message: 'Payment recorded', data: payment });
  } catch (error) { next(error); }
};

const getPaymentHistory = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationOptions(req.query);
    const filter = {};
    if (req.query.childId) filter.child = req.query.childId;
    if (req.query.parentId) filter.parent = req.query.parentId;

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate('parent', 'name phone')
        .populate('fee', 'title feeType finalAmount')
        .sort('-createdAt').skip(skip).limit(limit),
      Payment.countDocuments(filter),
    ]);
    return ApiResponse.paginated(res, { data: payments, page, limit, total });
  } catch (error) { next(error); }
};

module.exports = { getFees, createFee, getFee, updateFee, recordPayment, getPaymentHistory };
