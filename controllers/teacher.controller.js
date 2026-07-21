const Batch = require('../models/Batch');
const Child = require('../models/Child');
const Attendance = require('../models/Attendance');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Gallery = require('../models/Gallery');
const Message = require('../models/Message');
const LeaveRequest = require('../models/LeaveRequest');
const Teacher = require('../models/Teacher');
const Notification = require('../models/Notification');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const NotificationService = require('../services/notification.service');
const { getPaginationOptions, getDayBounds, getMonthBounds } = require('../utils/helpers');
const { NOTIFICATION_TYPES } = require('../utils/constants');

/**
 * @desc    Get teacher dashboard stats
 * @route   GET /api/teacher/dashboard
 */
const getDashboard = async (req, res, next) => {
  try {
    const teacherId = req.user._id;
    const today = new Date();
    const { start: todayStart, end: todayEnd } = getDayBounds(today);

    const teacherProfile = await Teacher.findOne({ user: teacherId }).populate('batches');
    const batchIds = teacherProfile ? teacherProfile.batches.map((b) => b._id) : [];

    // Parallel queries for dashboard data
    const [
      totalBatches,
      totalStudents,
      todayAttendance,
      pendingAssignments,
      unreadNotifications,
      upcomingAssignments,
    ] = await Promise.all([
      Batch.countDocuments({ teacher: teacherId, isActive: true }),
      Child.countDocuments({ teacher: teacherId, isActive: true }),
      Attendance.countDocuments({
        batch: { $in: batchIds },
        date: { $gte: todayStart, $lte: todayEnd },
      }),
      Assignment.countDocuments({
        teacher: teacherId,
        isActive: true,
        dueDate: { $gte: today },
      }),
      Notification.countDocuments({ recipient: teacherId, isRead: false }),
      Assignment.find({
        teacher: teacherId,
        isActive: true,
        dueDate: { $gte: today },
      })
        .sort('dueDate')
        .limit(5)
        .populate('batch', 'name'),
    ]);

    // Check which batches have attendance marked today
    const batchesWithAttendance = await Attendance.distinct('batch', {
      batch: { $in: batchIds },
      date: { $gte: todayStart, $lte: todayEnd },
    });

    const batchesNeedingAttendance = batchIds.filter(
      (id) => !batchesWithAttendance.some((b) => String(b) === String(id))
    );

    return ApiResponse.success(res, {
      data: {
        stats: {
          totalBatches,
          totalStudents,
          attendanceMarkedToday: batchesWithAttendance.length,
          batchesNeedingAttendance: batchesNeedingAttendance.length,
          pendingAssignments,
          unreadNotifications,
        },
        batches: teacherProfile ? teacherProfile.batches : [],
        upcomingAssignments,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get teacher's batches
 * @route   GET /api/teacher/batches
 */
const getMyBatches = async (req, res, next) => {
  try {
    const batches = await Batch.find({ teacher: req.user._id, isActive: true })
      .populate('subject', 'name color icon')
      .populate('children', 'name class photo');

    return ApiResponse.success(res, { data: batches });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get batch details
 * @route   GET /api/teacher/batches/:id
 */
const getBatchDetails = async (req, res, next) => {
  try {
    const batch = await Batch.findOne({
      _id: req.params.id,
      teacher: req.user._id,
    })
      .populate('subject')
      .populate({
        path: 'children',
        match: { isActive: true },
        populate: { path: 'parent', select: 'name phone' },
      });

    if (!batch) throw ApiError.notFound('Batch not found');

    return ApiResponse.success(res, { data: batch });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark attendance for a batch
 * @route   POST /api/teacher/attendance
 */
const markAttendance = async (req, res, next) => {
  try {
    const { batchId, date, records } = req.body;

    // Verify batch belongs to teacher
    const batch = await Batch.findOne({ _id: batchId, teacher: req.user._id });
    if (!batch) throw ApiError.forbidden('You can only mark attendance for your batches');

    // Normalize to start-of-day so re-marking the same day updates (not duplicates)
    const attDate = new Date(date);
    attDate.setHours(0, 0, 0, 0);

    const attendanceRecords = [];
    const absentChildren = [];

    for (const record of records) {
      const attendance = await Attendance.findOneAndUpdate(
        { child: record.childId, batch: batchId, date: attDate },
        {
          child: record.childId,
          batch: batchId,
          date: attDate,
          status: record.status,
          markedBy: req.user._id,
          remarks: record.remarks,
          arrivalTime: record.arrivalTime,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      attendanceRecords.push(attendance);

      if (record.status === 'absent') {
        absentChildren.push(record.childId);
      }
    }

    // Send notifications to parents of absent children
    if (absentChildren.length > 0) {
      const children = await Child.find({ _id: { $in: absentChildren } });
      for (const child of children) {
        await NotificationService.createNotification({
          recipientId: child.parent,
          title: 'Attendance Alert',
          body: `${child.name} was marked absent today`,
          type: NOTIFICATION_TYPES.ATTENDANCE,
          data: { childId: String(child._id), date },
          senderId: req.user._id,
        });
      }
    }

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`batch:${batchId}`).emit('attendance:updated', { batchId, date });
    }

    return ApiResponse.success(res, {
      message: `Attendance marked for ${attendanceRecords.length} students`,
      data: attendanceRecords,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get attendance history for a batch
 * @route   GET /api/teacher/attendance/:batchId
 */
const getAttendanceHistory = async (req, res, next) => {
  try {
    const { batchId } = req.params;
    const { date, month, year } = req.query;

    let filter = { batch: batchId };

    if (date) {
      const { start, end } = getDayBounds(date);
      filter.date = { $gte: start, $lte: end };
    } else if (month && year) {
      const { start, end } = getMonthBounds(parseInt(year), parseInt(month));
      filter.date = { $gte: start, $lte: end };
    }

    const attendance = await Attendance.find(filter)
      .populate('child', 'name class photo')
      .sort('-date');

    return ApiResponse.success(res, { data: attendance });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create an assignment
 * @route   POST /api/teacher/assignments
 */
const createAssignment = async (req, res, next) => {
  try {
    const { batchId, ...assignmentData } = req.body;

    // Verify batch belongs to teacher
    const batch = await Batch.findOne({ _id: batchId, teacher: req.user._id });
    if (!batch) throw ApiError.forbidden('You can only create assignments for your batches');

    const assignment = await Assignment.create({
      ...assignmentData,
      batch: batchId,
      teacher: req.user._id,
    });

    // Notify parents of children in this batch
    const children = await Child.find({ batch: batchId, isActive: true });
    const parentIds = [...new Set(children.map((c) => String(c.parent)))];

    await NotificationService.sendBulkNotification({
      recipientIds: parentIds,
      title: 'New Assignment',
      body: `${assignment.title} - Due: ${new Date(assignment.dueDate).toLocaleDateString()}`,
      type: NOTIFICATION_TYPES.ASSIGNMENT,
      data: { assignmentId: String(assignment._id), batchId },
      senderId: req.user._id,
    });

    const populatedAssignment = await Assignment.findById(assignment._id)
      .populate('batch', 'name');

    return ApiResponse.created(res, {
      message: 'Assignment created',
      data: populatedAssignment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an assignment
 * @route   PUT /api/teacher/assignments/:id
 */
const updateAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findOne({ _id: req.params.id, teacher: req.user._id });
    if (!assignment) throw ApiError.notFound('Assignment not found or not yours');

    const updated = await Assignment.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    }).populate('batch', 'name');

    return ApiResponse.success(res, { message: 'Assignment updated', data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete an assignment
 * @route   DELETE /api/teacher/assignments/:id
 */
const deleteAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findOne({ _id: req.params.id, teacher: req.user._id });
    if (!assignment) throw ApiError.notFound('Assignment not found or not yours');

    await Submission.deleteMany({ assignment: assignment._id });
    await Assignment.findByIdAndDelete(assignment._id);

    return ApiResponse.success(res, { message: 'Assignment deleted' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get assignments for teacher
 * @route   GET /api/teacher/assignments
 */
const getAssignments = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = getPaginationOptions(req.query);
    const filter = {
      teacher: req.user._id,
      ...(req.query.batchId && { batch: req.query.batchId }),
      ...(req.query.isActive !== undefined && { isActive: req.query.isActive === 'true' }),
    };

    const [assignments, total] = await Promise.all([
      Assignment.find(filter)
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
 * @desc    Send announcement to batch
 * @route   POST /api/teacher/announcements
 */
const sendAnnouncement = async (req, res, next) => {
  try {
    const { title, body, batchId, targetUserIds, priority } = req.body;

    const message = await Message.create({
      title,
      body,
      sender: req.user._id,
      senderRole: 'teacher',
      targetType: targetUserIds ? 'individual' : 'batch',
      targetBatches: batchId ? [batchId] : [],
      targetUsers: targetUserIds || [],
      priority: priority || 'normal',
    });

    // Notify recipients
    let recipientIds = [];
    if (targetUserIds && targetUserIds.length > 0) {
      recipientIds = targetUserIds;
    } else if (batchId) {
      const children = await Child.find({ batch: batchId, isActive: true });
      recipientIds = [...new Set(children.map((c) => String(c.parent)))];
    }

    if (recipientIds.length > 0) {
      await NotificationService.sendBulkNotification({
        recipientIds,
        title: `Announcement: ${title}`,
        body: body.substring(0, 100),
        type: NOTIFICATION_TYPES.ANNOUNCEMENT,
        data: { messageId: String(message._id) },
        senderId: req.user._id,
      });
    }

    return ApiResponse.created(res, {
      message: 'Announcement sent',
      data: message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Apply for leave
 * @route   POST /api/teacher/leave
 */
const applyLeave = async (req, res, next) => {
  try {
    const { startDate, endDate, reason, leaveType } = req.body;

    const leaveRequest = await LeaveRequest.create({
      teacher: req.user._id,
      startDate,
      endDate,
      reason,
      leaveType: leaveType || 'casual',
    });

    return ApiResponse.created(res, {
      message: 'Leave request submitted',
      data: leaveRequest,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get leave history
 * @route   GET /api/teacher/leave
 */
const getLeaveHistory = async (req, res, next) => {
  try {
    const leaves = await LeaveRequest.find({ teacher: req.user._id })
      .sort('-createdAt');

    return ApiResponse.success(res, { data: leaves });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get parents of children in this teacher's batches (for chat)
 * @route   GET /api/teacher/parents
 */
const getMyParents = async (req, res, next) => {
  try {
    const batches = await Batch.find({ teacher: req.user._id, isActive: true })
      .populate({
        path: 'children',
        match: { isActive: true },
        select: 'name class section parent',
        populate: { path: 'parent', select: 'name phone email role' },
      })
      .select('name subject children');

    const parentMap = new Map();
    batches.forEach((batch) => {
      (batch.children || []).forEach((child) => {
        const parent = child.parent;
        if (parent) {
          const pid = String(parent._id);
          if (!parentMap.has(pid)) {
            parentMap.set(pid, {
              _id: parent._id,
              name: parent.name,
              phone: parent.phone,
              email: parent.email,
              role: parent.role,
              children: [],
            });
          }
          parentMap.get(pid).children.push({
            _id: child._id,
            name: child.name,
            batchName: batch.name,
          });
        }
      });
    });

    return ApiResponse.success(res, { data: Array.from(parentMap.values()) });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload a new gallery item (moment)
 * @route   POST /api/teacher/gallery
 */
const uploadGalleryItem = async (req, res, next) => {
  try {
    const { title, description } = req.body;
    
    if (!req.file) {
      throw ApiError.badRequest('Please upload an image');
    }
    
    if (!title) {
      throw ApiError.badRequest('Title is required');
    }

    // Since we're hosting locally for now, construct the URL
    // e.g. /uploads/filename.jpg
    const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const baseUrl = `${protocol}://${req.get('host')}`;
    const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;

    const galleryItem = await Gallery.create({
      title,
      description,
      albumType: 'classroom_moment',
      uploadedBy: req.user._id,
      media: [{ url: fileUrl, type: 'image' }],
      isPublished: true, // Auto-publish teacher moments
    });

    return ApiResponse.success(res, {
      message: 'Moment uploaded successfully',
      data: galleryItem
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getMyBatches,
  getBatchDetails,
  markAttendance,
  getAttendanceHistory,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignments,
  sendAnnouncement,
  applyLeave,
  getLeaveHistory,
  getMyParents,
  uploadGalleryItem,
};
