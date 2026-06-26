const Child = require('../models/Child');
const Attendance = require('../models/Attendance');
const Assignment = require('../models/Assignment');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const { getPaginationOptions, buildSearchFilter, getMonthBounds } = require('../utils/helpers');

const createChild = async (req, res, next) => {
  try {
    const child = await Child.create(req.body);
    const populated = await Child.findById(child._id)
      .populate('parent', 'name phone')
      .populate('batch', 'name');
    return ApiResponse.created(res, { message: 'Child enrolled successfully', data: populated });
  } catch (error) { next(error); }
};

const getChildren = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = getPaginationOptions(req.query);
    const filter = {
      ...buildSearchFilter(req.query, ['name', 'class', 'section']),
      ...(req.query.isActive !== undefined
        ? { isActive: req.query.isActive === 'true' }
        : { isActive: true }),
      ...(req.query.batchId && { batch: req.query.batchId }),
      ...(req.query.parentId && { parent: req.query.parentId }),
    };

    const [children, total] = await Promise.all([
      Child.find(filter)
        .populate('parent', 'name phone')
        .populate('batch', 'name')
        .populate('teacher', 'name')
        .sort(sort).skip(skip).limit(limit),
      Child.countDocuments(filter),
    ]);
    return ApiResponse.paginated(res, { data: children, page, limit, total });
  } catch (error) { next(error); }
};

const getChild = async (req, res, next) => {
  try {
    const child = await Child.findById(req.params.id)
      .populate('parent', 'name phone email')
      .populate('batch', 'name classroom schedule')
      .populate('teacher', 'name phone');
    if (!child) throw ApiError.notFound('Child not found');
    return ApiResponse.success(res, { data: child });
  } catch (error) { next(error); }
};

const updateChild = async (req, res, next) => {
  try {
    const child = await Child.findById(req.params.id);
    if (!child) throw ApiError.notFound('Child not found');

    const updated = await Child.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    }).populate('parent', 'name phone').populate('batch', 'name');

    return ApiResponse.success(res, { message: 'Child updated', data: updated });
  } catch (error) { next(error); }
};

const deleteChild = async (req, res, next) => {
  try {
    const child = await Child.findById(req.params.id);
    if (!child) throw ApiError.notFound('Child not found');
    await Child.findByIdAndUpdate(req.params.id, { isActive: false });
    return ApiResponse.success(res, { message: 'Child deactivated' });
  } catch (error) { next(error); }
};

const getChildProgress = async (req, res, next) => {
  try {
    const child = await Child.findById(req.params.id).populate('batch', 'name');
    if (!child) throw ApiError.notFound('Child not found');

    const now = new Date();
    const { start, end } = getMonthBounds(now.getFullYear(), now.getMonth() + 1);

    const [attendanceRecords, activeAssignments] = await Promise.all([
      Attendance.find({ child: req.params.id, date: { $gte: start, $lte: end } }),
      child.batch
        ? Assignment.countDocuments({ batch: child.batch._id, isActive: true })
        : Promise.resolve(0),
    ]);

    const attendanceSummary = { present: 0, absent: 0, late: 0, total: attendanceRecords.length };
    attendanceRecords.forEach((r) => { if (attendanceSummary[r.status] !== undefined) attendanceSummary[r.status]++; });
    attendanceSummary.percentage = attendanceSummary.total > 0
      ? Math.round(((attendanceSummary.present + attendanceSummary.late) / attendanceSummary.total) * 100)
      : 0;

    return ApiResponse.success(res, {
      data: { child, attendance: attendanceSummary, activeAssignments },
    });
  } catch (error) { next(error); }
};

module.exports = { createChild, getChildren, getChild, updateChild, deleteChild, getChildProgress };
