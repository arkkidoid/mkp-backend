const Attendance = require('../models/Attendance');
const Batch = require('../models/Batch');
const Child = require('../models/Child');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const { getPaginationOptions, getDayBounds, getMonthBounds } = require('../utils/helpers');

/**
 * @desc    Bulk mark attendance for a batch
 * @route   POST /api/attendance
 */
const markAttendance = async (req, res, next) => {
  try {
    const { batchId, date, records } = req.body;

    if (!batchId || !date || !Array.isArray(records) || records.length === 0) {
      throw ApiError.badRequest('batchId, date, and records array are required');
    }

    const batch = await Batch.findById(batchId);
    if (!batch) throw ApiError.notFound('Batch not found');

    // Teachers can only mark attendance for their own batches
    if (req.user.role === 'teacher' && String(batch.teacher) !== String(req.user._id)) {
      throw ApiError.forbidden('You can only mark attendance for your own batches');
    }

    const attendanceDate = new Date(date);
    const savedRecords = await Promise.all(
      records.map((record) =>
        Attendance.findOneAndUpdate(
          { child: record.childId, batch: batchId, date: attendanceDate },
          {
            child: record.childId,
            batch: batchId,
            date: attendanceDate,
            status: record.status,
            markedBy: req.user._id,
            remarks: record.remarks,
            arrivalTime: record.arrivalTime,
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )
      )
    );

    return ApiResponse.success(res, {
      message: `Attendance marked for ${savedRecords.length} student(s)`,
      data: savedRecords,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get attendance records with optional date-range filtering
 * @route   GET /api/attendance
 */
const getAttendance = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationOptions(req.query);
    const filter = {};

    if (req.query.childId) filter.child = req.query.childId;
    if (req.query.batchId) filter.batch = req.query.batchId;
    if (req.query.status) filter.status = req.query.status;

    // Date range filtering
    if (req.query.date) {
      const { start, end } = getDayBounds(req.query.date);
      filter.date = { $gte: start, $lte: end };
    } else if (req.query.startDate || req.query.endDate) {
      filter.date = {};
      if (req.query.startDate) filter.date.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.date.$lte = new Date(req.query.endDate);
    } else if (req.query.month && req.query.year) {
      const { start, end } = getMonthBounds(
        parseInt(req.query.year),
        parseInt(req.query.month)
      );
      filter.date = { $gte: start, $lte: end };
    }

    const [attendance, total] = await Promise.all([
      Attendance.find(filter)
        .populate('child', 'name class photo')
        .populate('batch', 'name')
        .populate('markedBy', 'name role')
        .sort('-date')
        .skip(skip)
        .limit(limit),
      Attendance.countDocuments(filter),
    ]);

    return ApiResponse.paginated(res, { data: attendance, page, limit, total });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get monthly attendance summary for a child
 * @route   GET /api/attendance/child/:childId/summary
 */
const getChildAttendanceSummary = async (req, res, next) => {
  try {
    const { childId } = req.params;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;

    const child = await Child.findById(childId).populate('batch', 'name');
    if (!child) throw ApiError.notFound('Child not found');

    const { start, end } = getMonthBounds(year, month);

    const records = await Attendance.find({
      child: childId,
      date: { $gte: start, $lte: end },
    }).sort('date');

    const summary = {
      present: 0,
      absent: 0,
      late: 0,
      holiday: 0,
      total: records.length,
    };

    records.forEach((r) => {
      if (summary[r.status] !== undefined) summary[r.status]++;
    });

    const attendancePercentage =
      summary.total > 0
        ? Math.round(((summary.present + summary.late) / summary.total) * 100)
        : 0;

    return ApiResponse.success(res, {
      data: {
        child: { _id: child._id, name: child.name, class: child.class, batch: child.batch },
        month,
        year,
        summary,
        attendancePercentage,
        records,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a single attendance record
 * @route   PUT /api/attendance/:id
 */
const updateAttendance = async (req, res, next) => {
  try {
    const record = await Attendance.findById(req.params.id);
    if (!record) throw ApiError.notFound('Attendance record not found');

    // Teachers can only update attendance for their own batches
    if (req.user.role === 'teacher') {
      const batch = await Batch.findById(record.batch);
      if (!batch || String(batch.teacher) !== String(req.user._id)) {
        throw ApiError.forbidden('You can only update attendance for your own batches');
      }
    }

    const { status, remarks, arrivalTime } = req.body;
    const updated = await Attendance.findByIdAndUpdate(
      req.params.id,
      { status, remarks, arrivalTime, markedBy: req.user._id },
      { new: true, runValidators: true }
    )
      .populate('child', 'name class')
      .populate('markedBy', 'name');

    return ApiResponse.success(res, { message: 'Attendance updated', data: updated });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  markAttendance,
  getAttendance,
  getChildAttendanceSummary,
  updateAttendance,
};
