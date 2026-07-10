const Attendance = require('../models/Attendance');
const Payment = require('../models/Payment');
const Fee = require('../models/Fee');

/**
 * Real monthly trend data for the last `monthsBack` months (default 6),
 * computed from actual Attendance, Payment and Fee records.
 *
 * Returns:
 *   attendanceTrend: [{ date: 'Feb', attendanceRate }]
 *   revenueTrend:    [{ month: 'Feb', collected, pending, revenue }]
 */
async function monthlyTrends(now = new Date(), monthsBack = 6) {
  const buckets = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ y: d.getFullYear(), m: d.getMonth() + 1, label: d.toLocaleString('en-US', { month: 'short' }) });
  }
  const rangeStart = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1), 1);

  const [attAgg, payAgg, feeAgg] = await Promise.all([
    Attendance.aggregate([
      { $match: { date: { $gte: rangeStart } } },
      {
        $group: {
          _id: { y: { $year: '$date' }, m: { $month: '$date' } },
          present: { $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] } },
          total: { $sum: 1 },
        },
      },
    ]),
    Payment.aggregate([
      { $match: { createdAt: { $gte: rangeStart } } },
      { $group: { _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } }, collected: { $sum: '$amount' } } },
    ]),
    Fee.aggregate([
      { $match: { status: { $in: ['pending', 'overdue'] }, dueDate: { $gte: rangeStart } } },
      { $group: { _id: { y: { $year: '$dueDate' }, m: { $month: '$dueDate' } }, pending: { $sum: '$finalAmount' } } },
    ]),
  ]);

  const key = (o) => `${o.y}-${o.m}`;
  const attMap = Object.fromEntries(attAgg.map((a) => [key(a._id), a]));
  const payMap = Object.fromEntries(payAgg.map((p) => [key(p._id), p]));
  const feeMap = Object.fromEntries(feeAgg.map((f) => [key(f._id), f]));

  const attendanceTrend = buckets.map((b) => {
    const a = attMap[key(b)];
    return { date: b.label, attendanceRate: a && a.total > 0 ? Math.round((a.present / a.total) * 100) : 0 };
  });
  const revenueTrend = buckets.map((b) => {
    const collected = payMap[key(b)]?.collected || 0;
    const pending = feeMap[key(b)]?.pending || 0;
    return { month: b.label, collected, pending, revenue: collected };
  });

  return { attendanceTrend, revenueTrend };
}

module.exports = { monthlyTrends };
