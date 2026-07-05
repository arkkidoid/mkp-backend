const Child = require('../models/Child');
const Parent = require('../models/Parent');
const Attendance = require('../models/Attendance');
const Assignment = require('../models/Assignment');
const Fee = require('../models/Fee');
const Event = require('../models/Event');
const Gallery = require('../models/Gallery');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const { getDayBounds, getMonthBounds } = require('../utils/helpers');

/**
 * @desc    Get parent dashboard
 * @route   GET /api/parent/dashboard
 */
const getDashboard = async (req, res, next) => {
  try {
    const parentId = req.user._id;

    const parentProfile = await Parent.findOne({ user: parentId }).populate({
      path: 'children',
      match: { isActive: true },
      populate: [
        { path: 'batch', select: 'name classroom' },
        { path: 'teacher', select: 'name' },
      ],
    });

    const childrenIds = parentProfile
      ? parentProfile.children.map((c) => c._id)
      : [];

    const today = new Date();
    const { start: todayStart, end: todayEnd } = getDayBounds(today);

    const [
      pendingFees,
      totalPendingAmount,
      todayAttendance,
      activeAssignments,
      unreadNotifications,
      upcomingEvents,
      recentGallery,
    ] = await Promise.all([
      Fee.countDocuments({
        parent: parentId,
        status: { $in: ['pending', 'overdue'] },
      }),
      Fee.aggregate([
        {
          $match: {
            parent: parentId,
            status: { $in: ['pending', 'overdue'] },
          },
        },
        { $group: { _id: null, total: { $sum: '$finalAmount' } } },
      ]),
      Attendance.find({
        child: { $in: childrenIds },
        date: { $gte: todayStart, $lte: todayEnd },
      }).populate('child', 'name'),
      Assignment.find({
        batch: {
          $in: parentProfile
            ? parentProfile.children.filter((c) => c.batch).map((c) => c.batch._id)
            : [],
        },
        isActive: true,
        dueDate: { $gte: today },
      })
        .sort('dueDate')
        .limit(5)
        .populate('batch', 'name'),
      Notification.countDocuments({ recipient: parentId, isRead: false }),
      Event.find({
        startDate: { $gte: today },
        isActive: true,
      })
        .sort('startDate')
        .limit(3),
      Gallery.find({
        batch: {
          $in: parentProfile
            ? parentProfile.children.filter((c) => c.batch).map((c) => c.batch._id)
            : [],
        },
        isPublished: true,
      })
        .sort('-createdAt')
        .limit(5),
    ]);

    return ApiResponse.success(res, {
      data: {
        greeting: `Welcome back, ${req.user.name.split(' ')[0]}!`,
        stats: {
          totalChildren: parentProfile ? parentProfile.children.length : 0,
          pendingFees,
          pendingAmount:
            totalPendingAmount.length > 0 ? totalPendingAmount[0].total : 0,
          unreadNotifications,
        },
        children: parentProfile ? parentProfile.children : [],
        todayAttendance,
        activeAssignments,
        upcomingEvents,
        recentGallery,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get parent's children
 * @route   GET /api/parent/children
 */
const getMyChildren = async (req, res, next) => {
  try {
    const children = await Child.find({
      parent: req.user._id,
      isActive: true,
    })
      .populate('batch', 'name classroom schedule')
      .populate('teacher', 'name phone');

    // Attach attendance stats to each child
    const childrenWithStats = await Promise.all(
      children.map(async (child) => {
        const { start: monthStart, end: monthEnd } = getMonthBounds(
          new Date().getFullYear(),
          new Date().getMonth() + 1
        );

        const attendanceStats = await Attendance.aggregate([
          {
            $match: {
              child: child._id,
              date: { $gte: monthStart, $lte: monthEnd },
            },
          },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
        ]);

        const stats = {};
        attendanceStats.forEach((s) => {
          stats[s._id] = s.count;
        });

        return {
          ...child.toJSON(),
          attendanceStats: stats,
        };
      })
    );

    return ApiResponse.success(res, { data: childrenWithStats });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get child's attendance
 * @route   GET /api/parent/attendance/:childId
 */
const getChildAttendance = async (req, res, next) => {
  try {
    const { childId } = req.params;
    const { month, year } = req.query;

    // Verify child belongs to parent
    const child = await Child.findOne({
      _id: childId,
      parent: req.user._id,
    });
    if (!child) throw ApiError.notFound('Child not found');

    const currentMonth = parseInt(month) || new Date().getMonth() + 1;
    const currentYear = parseInt(year) || new Date().getFullYear();
    const { start, end } = getMonthBounds(currentYear, currentMonth);

    const attendance = await Attendance.find({
      child: childId,
      date: { $gte: start, $lte: end },
    }).sort('date');

    // Calculate stats
    const stats = {
      total: attendance.length,
      present: attendance.filter((a) => a.status === 'present').length,
      absent: attendance.filter((a) => a.status === 'absent').length,
      late: attendance.filter((a) => a.status === 'late').length,
      holiday: attendance.filter((a) => a.status === 'holiday').length,
    };
    stats.percentage =
      stats.total > 0
        ? Math.round(((stats.present + stats.late) / (stats.total - stats.holiday)) * 100)
        : 0;

    return ApiResponse.success(res, {
      data: {
        child: { name: child.name, class: child.class },
        month: currentMonth,
        year: currentYear,
        attendance,
        stats,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get child's assignments
 * @route   GET /api/parent/assignments/:childId
 */
const getChildAssignments = async (req, res, next) => {
  try {
    const { childId } = req.params;

    const child = await Child.findOne({
      _id: childId,
      parent: req.user._id,
    });
    if (!child) throw ApiError.notFound('Child not found');

    if (!child.batch) {
      return ApiResponse.success(res, { data: [] });
    }

    const assignments = await Assignment.find({
      batch: child.batch,
      isActive: true,
    })
      .populate('teacher', 'name')
      .sort('-createdAt');

    return ApiResponse.success(res, { data: assignments });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get child's fees
 * @route   GET /api/parent/fees/:childId
 */
const getChildFees = async (req, res, next) => {
  try {
    const { childId } = req.params;

    const child = await Child.findOne({
      _id: childId,
      parent: req.user._id,
    });
    if (!child) throw ApiError.notFound('Child not found');

    const fees = await Fee.find({ child: childId }).sort('-dueDate');

    const summary = {
      totalPending: fees
        .filter((f) => ['pending', 'overdue'].includes(f.status))
        .reduce((sum, f) => sum + f.finalAmount - f.paidAmount, 0),
      totalPaid: fees
        .filter((f) => f.status === 'paid')
        .reduce((sum, f) => sum + f.paidAmount, 0),
    };

    return ApiResponse.success(res, { data: { fees, summary } });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get gallery/classroom moments for parent's children
 * @route   GET /api/parent/gallery
 */
const getGallery = async (req, res, next) => {
  try {
    const children = await Child.find({
      parent: req.user._id,
      isActive: true,
    });
    const batchIds = children.filter((c) => c.batch).map((c) => c.batch);

    const gallery = await Gallery.find({
      batch: { $in: batchIds },
      isPublished: true,
    })
      .populate('batch', 'name')
      .populate('uploadedBy', 'name')
      .sort('-createdAt')
      .limit(50);

    return ApiResponse.success(res, { data: gallery });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get messages for parent
 * @route   GET /api/parent/messages
 */
const getMessages = async (req, res, next) => {
  try {
    const parentId = req.user._id;
    const children = await Child.find({ parent: parentId, isActive: true });
    const batchIds = children.filter((c) => c.batch).map((c) => c.batch);

    const messages = await Message.find({
      isActive: true,
      $or: [
        { targetType: 'all' },
        { targetType: 'all_parents' },
        { targetType: 'batch', targetBatches: { $in: batchIds } },
        { targetType: 'individual', targetUsers: parentId },
      ],
    })
      .populate('sender', 'name role')
      .sort('-createdAt');

    return ApiResponse.success(res, { data: messages });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get teachers for this parent's children (for chat)
 * @route   GET /api/parent/teachers
 */
const getMyTeachers = async (req, res, next) => {
  try {
    const children = await Child.find({ parent: req.user._id, isActive: true })
      .populate({
        path: 'batch',
        select: 'name teacher subject',
        populate: [
          { path: 'teacher', select: 'name phone email role' },
          { path: 'subject', select: 'name color' },
        ],
      });

    const teacherMap = new Map();
    children.forEach((child) => {
      const teacher = child.batch?.teacher;
      if (teacher) {
        const tid = String(teacher._id);
        if (!teacherMap.has(tid)) {
          teacherMap.set(tid, {
            _id: teacher._id,
            name: teacher.name,
            phone: teacher.phone,
            email: teacher.email,
            role: teacher.role,
            subject: child.batch?.subject?.name || '',
            children: [],
          });
        }
        teacherMap.get(tid).children.push({
          _id: child._id,
          name: child.name,
          batchName: child.batch?.name,
        });
      }
    });

    return ApiResponse.success(res, { data: Array.from(teacherMap.values()) });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getMyChildren,
  getChildAttendance,
  getChildAssignments,
  getChildFees,
  getGallery,
  getMessages,
  getMyTeachers,
};
