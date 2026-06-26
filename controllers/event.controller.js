const Event = require('../models/Event');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const { getPaginationOptions } = require('../utils/helpers');

const getEvents = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationOptions(req.query);
    const filter = { isActive: true };
    if (req.query.type) filter.type = req.query.type;
    if (req.query.upcoming === 'true') filter.startDate = { $gte: new Date() };

    const [events, total] = await Promise.all([
      Event.find(filter).populate('createdBy', 'name').sort('startDate').skip(skip).limit(limit),
      Event.countDocuments(filter),
    ]);
    return ApiResponse.paginated(res, { data: events, page, limit, total });
  } catch (error) { next(error); }
};

const createEvent = async (req, res, next) => {
  try {
    const event = await Event.create({ ...req.body, createdBy: req.user._id });
    return ApiResponse.created(res, { message: 'Event created', data: event });
  } catch (error) { next(error); }
};

const updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!event) throw ApiError.notFound('Event not found');
    return ApiResponse.success(res, { data: event });
  } catch (error) { next(error); }
};

const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!event) throw ApiError.notFound('Event not found');
    return ApiResponse.success(res, { message: 'Event deleted' });
  } catch (error) { next(error); }
};

module.exports = { getEvents, createEvent, updateEvent, deleteEvent };
