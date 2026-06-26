const Message = require('../models/Message');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const { getPaginationOptions } = require('../utils/helpers');

const getMessages = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationOptions(req.query);
    const filter = { isActive: true };
    if (req.query.targetRole) filter.targetRole = { $in: [req.query.targetRole, 'all'] };

    const [messages, total] = await Promise.all([
      Message.find(filter)
        .populate('sender', 'name role')
        .sort('-createdAt').skip(skip).limit(limit),
      Message.countDocuments(filter),
    ]);
    return ApiResponse.paginated(res, { data: messages, page, limit, total });
  } catch (error) { next(error); }
};

const createMessage = async (req, res, next) => {
  try {
    const message = await Message.create({ ...req.body, sender: req.user._id });
    const populated = await Message.findById(message._id).populate('sender', 'name role');
    return ApiResponse.created(res, { message: 'Announcement sent', data: populated });
  } catch (error) { next(error); }
};

const getMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id).populate('sender', 'name role');
    if (!message || !message.isActive) throw ApiError.notFound('Message not found');
    return ApiResponse.success(res, { data: message });
  } catch (error) { next(error); }
};

const deleteMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) throw ApiError.notFound('Message not found');
    if (req.user.role !== 'admin' && String(message.sender) !== String(req.user._id)) {
      throw ApiError.forbidden('Access denied');
    }
    await Message.findByIdAndUpdate(req.params.id, { isActive: false });
    return ApiResponse.success(res, { message: 'Message deleted' });
  } catch (error) { next(error); }
};

module.exports = { getMessages, createMessage, getMessage, deleteMessage };
