const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Batch = require('../models/Batch');
const Child = require('../models/Child');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const { getPaginationOptions, buildSearchFilter } = require('../utils/helpers');

/**
 * @desc    Create an assignment
 * @route   POST /api/assignments
 */
const createAssignment = async (req, res, next) => {
  try {
    const { batchId, ...assignmentData } = req.body;

    // Verify batch exists
    const batch = await Batch.findById(batchId);
    if (!batch) throw ApiError.notFound('Batch not found');

    // Teachers can only create assignments for their own batches
    if (req.user.role === 'teacher' && String(batch.teacher) !== String(req.user._id)) {
      throw ApiError.forbidden('You can only create assignments for your own batches');
    }

    const assignment = await Assignment.create({
      ...assignmentData,
      batch: batchId,
      teacher: req.user._id,
    });

    const populated = await Assignment.findById(assignment._id)
      .populate('teacher', 'name')
      .populate('batch', 'name');

    return ApiResponse.created(res, {
      message: 'Assignment created successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single assignment
 * @route   GET /api/assignments/:id
 */
const getAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('teacher', 'name')
      .populate('batch', 'name');
    if (!assignment) throw ApiError.notFound('Assignment not found');
    return ApiResponse.success(res, { data: assignment });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all assignments with filters
 * @route   GET /api/assignments
 */
const getAssignments = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = getPaginationOptions(req.query);
    const filter = {
      ...buildSearchFilter(req.query, ['title']),
      ...(req.query.batchId && { batch: req.query.batchId }),
      ...(req.query.teacherId && { teacher: req.query.teacherId }),
      ...(req.query.isActive !== undefined
        ? { isActive: req.query.isActive === 'true' }
        : { isActive: true }),
    };

    const [assignments, total] = await Promise.all([
      Assignment.find(filter)
        .populate('teacher', 'name')
        .populate('batch', 'name')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Assignment.countDocuments(filter),
    ]);

    return ApiResponse.paginated(res, { data: assignments, page, limit, total });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an assignment
 * @route   PUT /api/assignments/:id
 */
const updateAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) throw ApiError.notFound('Assignment not found');

    // Teachers can only update their own assignments
    if (req.user.role === 'teacher' && String(assignment.teacher) !== String(req.user._id)) {
      throw ApiError.forbidden('You can only update your own assignments');
    }

    const updated = await Assignment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('teacher', 'name')
      .populate('batch', 'name');

    return ApiResponse.success(res, { message: 'Assignment updated', data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete (soft) an assignment
 * @route   DELETE /api/assignments/:id
 */
const deleteAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) throw ApiError.notFound('Assignment not found');

    // Teachers can only delete their own assignments
    if (req.user.role === 'teacher' && String(assignment.teacher) !== String(req.user._id)) {
      throw ApiError.forbidden('You can only delete your own assignments');
    }

    await Assignment.findByIdAndUpdate(req.params.id, { isActive: false });

    return ApiResponse.success(res, { message: 'Assignment deleted' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get submissions for an assignment
 * @route   GET /api/assignments/:id/submissions
 */
const getSubmissions = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) throw ApiError.notFound('Assignment not found');

    // Teachers can only view submissions for their own assignments
    if (req.user.role === 'teacher' && String(assignment.teacher) !== String(req.user._id)) {
      throw ApiError.forbidden('Access denied');
    }

    const { page, limit, skip } = getPaginationOptions(req.query);
    const filter = { assignment: req.params.id };
    if (req.query.status) filter.status = req.query.status;

    // Count total children in the batch for submission rate
    const [submissions, total, totalChildren] = await Promise.all([
      Submission.find(filter)
        .populate('child', 'name class photo')
        .populate('submittedBy', 'name')
        .populate('reviewedBy', 'name')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit),
      Submission.countDocuments(filter),
      Child.countDocuments({ batch: assignment.batch, isActive: true }),
    ]);

    return ApiResponse.paginated(res, {
      data: submissions,
      page,
      limit,
      total,
      message: `${total} of ${totalChildren} students submitted`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAssignment,
  getAssignment,
  getAssignments,
  updateAssignment,
  deleteAssignment,
  getSubmissions,
};
