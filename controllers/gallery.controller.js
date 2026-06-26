const Gallery = require('../models/Gallery');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const { getPaginationOptions } = require('../utils/helpers');

const getGallery = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationOptions(req.query);
    const filter = { isPublished: true };
    if (req.query.batchId) filter.batch = req.query.batchId;
    if (req.query.albumType) filter.albumType = req.query.albumType;

    const [items, total] = await Promise.all([
      Gallery.find(filter)
        .populate('batch', 'name')
        .populate('uploadedBy', 'name')
        .sort('-createdAt').skip(skip).limit(limit),
      Gallery.countDocuments(filter),
    ]);
    return ApiResponse.paginated(res, { data: items, page, limit, total });
  } catch (error) { next(error); }
};

const createGallery = async (req, res, next) => {
  try {
    // In dev, mediaUrl can be passed directly; in prod use upload middleware
    const gallery = await Gallery.create({ ...req.body, uploadedBy: req.user._id });
    const populated = await Gallery.findById(gallery._id)
      .populate('batch', 'name').populate('uploadedBy', 'name');
    return ApiResponse.created(res, { message: 'Moment uploaded', data: populated });
  } catch (error) { next(error); }
};

const deleteGallery = async (req, res, next) => {
  try {
    const item = await Gallery.findById(req.params.id);
    if (!item) throw ApiError.notFound('Gallery item not found');

    if (req.user.role !== 'admin' && String(item.uploadedBy) !== String(req.user._id)) {
      throw ApiError.forbidden('You can only delete your own uploads');
    }

    await Gallery.findByIdAndUpdate(req.params.id, { isPublished: false });
    return ApiResponse.success(res, { message: 'Gallery item removed' });
  } catch (error) { next(error); }
};

module.exports = { getGallery, createGallery, deleteGallery };
