const Batch = require('../models/Batch');
const Child = require('../models/Child');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const { getPaginationOptions, buildSearchFilter } = require('../utils/helpers');

const createBatch = async (req, res, next) => {
  try {
    const batch = await Batch.create(req.body);
    const populated = await Batch.findById(batch._id)
      .populate('teacher', 'name phone')
      .populate('subject', 'name');
    return ApiResponse.created(res, { message: 'Batch created', data: populated });
  } catch (error) { next(error); }
};

const getBatches = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = getPaginationOptions(req.query);
    const filter = {
      ...buildSearchFilter(req.query, ['name']),
      ...(req.query.teacherId && { teacher: req.query.teacherId }),
      ...(req.query.isActive !== undefined
        ? { isActive: req.query.isActive === 'true' }
        : {}),
    };

    const [batches, total] = await Promise.all([
      Batch.find(filter)
        .populate('teacher', 'name phone')
        .populate('subject', 'name')
        .sort(sort).skip(skip).limit(limit),
      Batch.countDocuments(filter),
    ]);

    return ApiResponse.paginated(res, { data: batches, page, limit, total });
  } catch (error) { next(error); }
};

const getBatch = async (req, res, next) => {
  try {
    const batch = await Batch.findById(req.params.id)
      .populate('teacher', 'name phone')
      .populate('subject', 'name')
      .populate('children', 'name class photo');
    if (!batch) throw ApiError.notFound('Batch not found');
    return ApiResponse.success(res, { data: batch });
  } catch (error) { next(error); }
};

const updateBatch = async (req, res, next) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) throw ApiError.notFound('Batch not found');

    const updated = await Batch.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    }).populate('teacher', 'name').populate('subject', 'name');

    return ApiResponse.success(res, { message: 'Batch updated', data: updated });
  } catch (error) { next(error); }
};

const deleteBatch = async (req, res, next) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) throw ApiError.notFound('Batch not found');
    await Batch.findByIdAndUpdate(req.params.id, { isActive: false });
    return ApiResponse.success(res, { message: 'Batch deactivated' });
  } catch (error) { next(error); }
};

const addChildToBatch = async (req, res, next) => {
  try {
    const { childId } = req.body;
    const [batch, child] = await Promise.all([
      Batch.findById(req.params.id),
      Child.findById(childId),
    ]);
    if (!batch) throw ApiError.notFound('Batch not found');
    if (!child) throw ApiError.notFound('Child not found');
    if (batch.children.includes(childId)) throw ApiError.badRequest('Child already in batch');
    if (batch.children.length >= batch.capacity) throw ApiError.badRequest('Batch is at full capacity');

    batch.children.push(childId);
    child.batch = batch._id;
    child.teacher = batch.teacher;
    await Promise.all([batch.save(), child.save()]);

    return ApiResponse.success(res, { message: 'Child added to batch' });
  } catch (error) { next(error); }
};

const removeChildFromBatch = async (req, res, next) => {
  try {
    const { childId } = req.body;
    const batch = await Batch.findById(req.params.id);
    if (!batch) throw ApiError.notFound('Batch not found');

    batch.children = batch.children.filter((c) => String(c) !== String(childId));
    await batch.save();
    await Child.findByIdAndUpdate(childId, { $unset: { batch: 1, teacher: 1 } });

    return ApiResponse.success(res, { message: 'Child removed from batch' });
  } catch (error) { next(error); }
};

module.exports = { createBatch, getBatches, getBatch, updateBatch, deleteBatch, addChildToBatch, removeChildFromBatch };
