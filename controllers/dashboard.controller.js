const User = require('../models/User');
const Child = require('../models/Child');
const Batch = require('../models/Batch');
const Attendance = require('../models/Attendance');
const Fee = require('../models/Fee');
const Payment = require('../models/Payment');
const ApiResponse = require('../utils/apiResponse');
const { getDayBounds, getMonthBounds } = require('../utils/helpers');

/**
 * @desc    Get admin dashboard stats
 * @route   GET /api/dashboard/admin
 */
const getAdminDashboard = async (req, res, next) => {
  try {
    const today = new Date();
    const { start: todayStart, end: todayEnd } = getDayBounds(today);
    const { start: monthStart, end: monthEnd } = getMonthBounds(
      today.getFullYear(),
      today.getMonth() + 1
    );

    const [
      totalChildren,
      totalParents,
      totalTeachers,
      activeBatches,
      todayAttendance,
      pendingFees,
      monthlyRevenue,
      recentPayments,
    ] = await Promise.all([
      Child.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'parent', isActive: true }),
      User.countDocuments({ role: 'teacher', isActive: true }),
      Batch.countDocuments({ isActive: true }),
      Attendance.aggregate([
        { $match: { date: { $gte: todayStart, $lte: todayEnd } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Fee.aggregate([
        { $match: { status: { $in: ['pending', 'overdue'] } } },
        { $group: { _id: null, total: { $sum: '$finalAmount' }, count: { $sum: 1 } } },
      ]),
      Payment.aggregate([
        {
          $match: { createdAt: { $gte: monthStart, $lte: monthEnd } },
        },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Payment.find()
        .populate('parent', 'name')
        .sort('-createdAt')
        .limit(5),
    ]);

    // Attendance summary for today
    const attendanceSummary = {};
    todayAttendance.forEach((item) => {
      attendanceSummary[item._id] = item.count;
    });

    // Monthly attendance trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const attendanceTrends = await Attendance.aggregate([
      { $match: { date: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            status: '$status',
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    return ApiResponse.success(res, {
      data: {
        stats: {
          totalChildren,
          totalParents,
          totalTeachers,
          activeBatches,
          todayAttendance: attendanceSummary,
          pendingFees: pendingFees.length > 0 ? pendingFees[0] : { total: 0, count: 0 },
          monthlyRevenue: monthlyRevenue.length > 0 ? monthlyRevenue[0] : { total: 0, count: 0 },
        },
        attendanceTrends,
        recentPayments,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAdminDashboard };
