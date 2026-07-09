const User = require('../models/User');
const Parent = require('../models/Parent');
const Teacher = require('../models/Teacher');
const Child = require('../models/Child');
const Batch = require('../models/Batch');
const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');
const Fee = require('../models/Fee');
const Submission = require('../models/Submission');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const { getPaginationOptions, buildSearchFilter, getDayBounds } = require('../utils/helpers');

// ==================== PARENT MANAGEMENT ====================

/**
 * @desc    Get all parents
 * @route   GET /api/admin/parents
 */
const getParents = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = getPaginationOptions(req.query);
    const filter = {
      ...buildSearchFilter(req.query, ['name', 'email', 'phone']),
      role: 'parent',
      ...(req.query.isActive !== undefined && { isActive: req.query.isActive === 'true' }),
    };

    const [parents, total] = await Promise.all([
      User.find(filter).sort(sort).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    // Attach parent profiles with children count
    const parentsWithProfile = await Promise.all(
      parents.map(async (user) => {
        const profile = await Parent.findOne({ user: user._id }).populate('children', 'name class');
        return { ...user.toJSON(), profile };
      })
    );

    return ApiResponse.paginated(res, {
      data: parentsWithProfile,
      page,
      limit,
      total,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single parent
 * @route   GET /api/admin/parents/:id
 */
const getParent = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: 'parent' });
    if (!user) throw ApiError.notFound('Parent not found');

    const profile = await Parent.findOne({ user: user._id }).populate({
      path: 'children',
      populate: [
        { path: 'batch', select: 'name classroom' },
        { path: 'teacher', select: 'name' },
      ],
    });

    return ApiResponse.success(res, { data: { user, profile } });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a parent
 * @route   POST /api/admin/parents
 */
const createParent = async (req, res, next) => {
  try {
    const { name, email, phone, password, accessCode, address, occupation, emergencyContacts } = req.body;

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      password: password || undefined,
      accessCode: accessCode || undefined,
      role: 'parent',
      isVerified: true,
      address,
    });

    // Create parent profile
    const profile = await Parent.create({
      user: user._id,
      occupation,
      emergencyContacts: emergencyContacts || [],
    });

    return ApiResponse.created(res, {
      message: 'Parent created successfully',
      data: { user: user.toJSON(), profile },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a parent
 * @route   PUT /api/admin/parents/:id
 */
const updateParent = async (req, res, next) => {
  try {
    const { name, email, phone, address, isActive, occupation, emergencyContacts, accessCode } = req.body;

    const userUpdate = { name, email, phone, address, isActive };
    if (accessCode) userUpdate.accessCode = accessCode;

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'parent' },
      userUpdate,
      { new: true, runValidators: true }
    );

    if (!user) throw ApiError.notFound('Parent not found');

    if (occupation !== undefined || emergencyContacts !== undefined) {
      const updateData = {};
      if (occupation !== undefined) updateData.occupation = occupation;
      if (emergencyContacts !== undefined) updateData.emergencyContacts = emergencyContacts;
      await Parent.findOneAndUpdate({ user: user._id }, updateData);
    }

    const profile = await Parent.findOne({ user: user._id });
    return ApiResponse.success(res, { message: 'Parent updated', data: { user, profile } });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a parent permanently
 * @route   DELETE /api/admin/parents/:id
 */
const deleteParent = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'parent') throw ApiError.notFound('Parent not found');

    const profile = await Parent.findOne({ user: user._id });
    
    // Unset parent reference in all their children
    if (profile && profile.children.length > 0) {
      await Child.updateMany(
        { _id: { $in: profile.children } },
        { $unset: { parent: 1 } }
      );
    }

    await Parent.findOneAndDelete({ user: user._id });
    await User.findByIdAndDelete(user._id);

    return ApiResponse.success(res, { message: 'Parent permanently deleted' });
  } catch (error) {
    next(error);
  }
};

// ==================== TEACHER MANAGEMENT ====================

/**
 * @desc    Get all teachers
 * @route   GET /api/admin/teachers
 */
const getTeachers = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = getPaginationOptions(req.query);
    const filter = {
      ...buildSearchFilter(req.query, ['name', 'email', 'phone']),
      role: 'teacher',
      ...(req.query.isActive !== undefined && { isActive: req.query.isActive === 'true' }),
    };

    const [teachers, total] = await Promise.all([
      User.find(filter).sort(sort).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    const teachersWithProfile = await Promise.all(
      teachers.map(async (user) => {
        const profile = await Teacher.findOne({ user: user._id })
          .populate('subjects', 'name color')
          .populate('batches', 'name');
        return { ...user.toJSON(), profile };
      })
    );

    return ApiResponse.paginated(res, { data: teachersWithProfile, page, limit, total });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single teacher
 * @route   GET /api/admin/teachers/:id
 */
const getTeacher = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: 'teacher' });
    if (!user) throw ApiError.notFound('Teacher not found');

    const profile = await Teacher.findOne({ user: user._id })
      .populate('subjects')
      .populate({
        path: 'batches',
        populate: { path: 'children', select: 'name class' },
      });

    return ApiResponse.success(res, { data: { user, profile } });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a teacher
 * @route   POST /api/admin/teachers
 */
const createTeacher = async (req, res, next) => {
  try {
    const {
      name, email, phone, password, accessCode, address,
      qualification, experience, specialization, employeeId, subjects, joiningDate,
    } = req.body;

    const user = await User.create({
      name, email, phone,
      password: password || undefined,
      accessCode: accessCode || undefined,
      role: 'teacher',
      isVerified: true,
      address,
    });

    const profile = await Teacher.create({
      user: user._id,
      employeeId,
      qualification,
      experience,
      specialization,
      subjects: subjects || [],
      joiningDate,
    });

    return ApiResponse.created(res, {
      message: 'Teacher created successfully',
      data: { user: user.toJSON(), profile },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a teacher
 * @route   PUT /api/admin/teachers/:id
 */
const updateTeacher = async (req, res, next) => {
  try {
    const { name, email, phone, address, isActive, accessCode, ...profileData } = req.body;

    const userUpdate = { name, email, phone, address, isActive };
    if (accessCode) userUpdate.accessCode = accessCode;

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'teacher' },
      userUpdate,
      { new: true, runValidators: true }
    );
    if (!user) throw ApiError.notFound('Teacher not found');

    if (Object.keys(profileData).length > 0) {
      await Teacher.findOneAndUpdate({ user: user._id }, profileData);
    }

    const profile = await Teacher.findOne({ user: user._id })
      .populate('subjects', 'name color')
      .populate('batches', 'name');

    return ApiResponse.success(res, { message: 'Teacher updated', data: { user, profile } });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a teacher permanently
 * @route   DELETE /api/admin/teachers/:id
 */
const deleteTeacher = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'teacher') throw ApiError.notFound('Teacher not found');

    const profile = await Teacher.findOne({ user: user._id });

    // Unset teacher in all batches they were assigned to
    if (profile && profile.batches.length > 0) {
      await Batch.updateMany(
        { _id: { $in: profile.batches } },
        { $unset: { teacher: 1 } }
      );
    }

    // Unset teacher from children documents directly
    await Child.updateMany(
      { teacher: user._id },
      { $unset: { teacher: 1 } }
    );

    await Teacher.findOneAndDelete({ user: user._id });
    await User.findByIdAndDelete(user._id);

    return ApiResponse.success(res, { message: 'Teacher permanently deleted' });
  } catch (error) {
    next(error);
  }
};

// ==================== CHILD MANAGEMENT ====================

/**
 * @desc    Get all children
 * @route   GET /api/admin/children
 */
const getChildren = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = getPaginationOptions(req.query);
    const filter = {
      ...buildSearchFilter(req.query, ['name', 'class', 'admissionNumber']),
      ...(req.query.isActive !== undefined && { isActive: req.query.isActive === 'true' }),
      ...(req.query.class && { class: req.query.class }),
      ...(req.query.batchId && { batch: req.query.batchId }),
      ...(req.query.parentId && { parent: req.query.parentId }),
    };

    const [children, total] = await Promise.all([
      Child.find(filter)
        .populate('parent', 'name phone email')
        .populate('batch', 'name classroom')
        .populate('teacher', 'name')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Child.countDocuments(filter),
    ]);

    return ApiResponse.paginated(res, { data: children, page, limit, total });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single child
 * @route   GET /api/admin/children/:id
 */
const getChild = async (req, res, next) => {
  try {
    const child = await Child.findById(req.params.id)
      .populate('parent', 'name phone email')
      .populate('batch', 'name classroom schedule')
      .populate('teacher', 'name phone');

    if (!child) throw ApiError.notFound('Child not found');

    return ApiResponse.success(res, { data: child });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a child
 * @route   POST /api/admin/children
 */
/**
 * Normalize a batch name to "COURSECODE-LABEL" (e.g. "ROB-A"). Idempotent —
 * strips an existing matching code prefix before re-applying, so re-saving
 * "ROB-A" stays "ROB-A" and a bare "A" becomes "ROB-A".
 */
const buildBatchName = (rawName, courseCode) => {
  let label = (rawName || '').trim();
  if (!courseCode) return label;
  const prefix = `${courseCode}-`;
  if (label.toUpperCase().startsWith(prefix.toUpperCase())) label = label.slice(prefix.length);
  return `${courseCode}-${label}`;
};

/**
 * Enroll a child into a batch's course: set the class label to the batch
 * name (already "COURSECODE-LABEL", e.g. "ROB-A") and auto-assign the course
 * fees (one-time admission + first month) to the child's parent.
 */
const enrollInBatchCourse = async (childId, batchId, parentId) => {
  if (!batchId) return;
  const batch = await Batch.findById(batchId).populate('subject');
  const course = batch?.subject;
  if (!course) return;

  // Class label = batch name (e.g. "ROB-A"); section = course code
  await Child.findByIdAndUpdate(childId, {
    class: batch.name,
    section: course.code,
  });

  // Auto-assign fees (skip any that already exist for this child + course)
  const escaped = course.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const existing = await Fee.countDocuments({ child: childId, title: new RegExp('^' + escaped + ' — ') });
  if (existing > 0) return;

  const now = new Date();
  const due = new Date(now);
  due.setDate(due.getDate() + 7);
  const monthLabel = now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const fees = [];
  if (course.admissionFee > 0) {
    fees.push({
      child: childId, parent: parentId,
      title: `${course.name} — Admission Fee`,
      amount: course.admissionFee, discount: 0, finalAmount: course.admissionFee,
      dueDate: due, status: 'pending', feeType: 'other',
    });
  }
  if (course.monthlyFee > 0) {
    fees.push({
      child: childId, parent: parentId,
      title: `${course.name} — Fee (${monthLabel})`,
      amount: course.monthlyFee, discount: 0, finalAmount: course.monthlyFee,
      dueDate: due, status: 'pending', feeType: 'tuition', month: monthLabel, isRecurring: true,
    });
  }
  if (fees.length) await Fee.insertMany(fees);
};

const createChild = async (req, res, next) => {
  try {
    const { parentId, batchId, teacherId, ...childData } = req.body;

    // Verify parent exists
    const parent = await User.findOne({ _id: parentId, role: 'parent', isActive: true });
    if (!parent) throw ApiError.notFound('Parent not found');

    const child = await Child.create({
      ...childData,
      parent: parentId,
      batch: batchId,
      teacher: teacherId,
    });

    // Link child to parent profile
    await Parent.findOneAndUpdate(
      { user: parentId },
      { $addToSet: { children: child._id } }
    );

    // Add child to batch + derive class + auto-assign course fees
    if (batchId) {
      await Batch.findByIdAndUpdate(batchId, {
        $addToSet: { children: child._id },
      });
      await enrollInBatchCourse(child._id, batchId, parentId);
    }

    const populatedChild = await Child.findById(child._id)
      .populate('parent', 'name phone')
      .populate('batch', 'name')
      .populate('teacher', 'name');

    return ApiResponse.created(res, {
      message: 'Child enrolled successfully',
      data: populatedChild,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a child
 * @route   PUT /api/admin/children/:id
 */
const updateChild = async (req, res, next) => {
  try {
    const { batchId, teacherId, ...updateData } = req.body;
    // class + section are system-derived from the batch's course — never set manually
    delete updateData.class;
    delete updateData.section;

    const child = await Child.findById(req.params.id);
    if (!child) throw ApiError.notFound('Child not found');

    // Handle batch transfer
    if (batchId !== undefined && batchId !== String(child.batch)) {
      // Remove from old batch
      if (child.batch) {
        await Batch.findByIdAndUpdate(child.batch, {
          $pull: { children: child._id },
        });
      }
      // Add to new batch
      if (batchId) {
        await Batch.findByIdAndUpdate(batchId, {
          $addToSet: { children: child._id },
        });
      }
      updateData.batch = batchId;
    }

    // Re-derive class + assign course fees when (re)assigned to a batch
    if (batchId) {
      await enrollInBatchCourse(child._id, batchId, child.parent);
    }

    if (teacherId !== undefined) {
      updateData.teacher = teacherId;
    }

    const updatedChild = await Child.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('parent', 'name phone')
      .populate('batch', 'name')
      .populate('teacher', 'name');

    return ApiResponse.success(res, { message: 'Child updated', data: updatedChild });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a child permanently
 * @route   DELETE /api/admin/children/:id
 */
const deleteChild = async (req, res, next) => {
  try {
    const child = await Child.findById(req.params.id);
    if (!child) throw ApiError.notFound('Child not found');

    // Remove from Batch
    if (child.batch) {
      await Batch.findByIdAndUpdate(child.batch, {
        $pull: { children: child._id },
      });
    }

    // Remove from Parent's profile
    if (child.parent) {
      await Parent.findOneAndUpdate(
        { user: child.parent },
        { $pull: { children: child._id } }
      );
    }

    // Delete orphaned records
    await Attendance.deleteMany({ child: child._id });
    await Fee.deleteMany({ child: child._id });
    await Submission.deleteMany({ child: child._id });

    // Permanently delete the child document
    await Child.findByIdAndDelete(req.params.id);

    return ApiResponse.success(res, { message: 'Child permanently deleted' });
  } catch (error) {
    next(error);
  }
};

// ==================== BATCH MANAGEMENT ====================

/**
 * @desc    Get all batches
 * @route   GET /api/admin/batches
 */
const getBatches = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = getPaginationOptions(req.query);
    const filter = {
      ...buildSearchFilter(req.query, ['name', 'classroom']),
      ...(req.query.isActive !== undefined && { isActive: req.query.isActive === 'true' }),
      ...(req.query.teacherId && { teacher: req.query.teacherId }),
    };

    const [batches, total] = await Promise.all([
      Batch.find(filter)
        .populate('teacher', 'name phone')
        .populate('subject', 'name code color')
        .populate('children', 'name class')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Batch.countDocuments(filter),
    ]);

    return ApiResponse.paginated(res, { data: batches, page, limit, total });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a batch
 * @route   POST /api/admin/batches
 */
const createBatch = async (req, res, next) => {
  try {
    const { teacherId, subjectId, ...batchData } = req.body;

    // Verify teacher exists
    const teacher = await User.findOne({ _id: teacherId, role: 'teacher', isActive: true });
    if (!teacher) throw ApiError.notFound('Teacher not found');

    // Name the batch "COURSECODE-LABEL" (e.g. "ROB-A")
    const course = subjectId ? await Subject.findById(subjectId) : null;
    batchData.name = buildBatchName(batchData.name, course?.code);

    const batch = await Batch.create({
      ...batchData,
      teacher: teacherId,
      subject: subjectId,
    });

    // Add batch to teacher profile
    await Teacher.findOneAndUpdate(
      { user: teacherId },
      { $addToSet: { batches: batch._id } }
    );

    const populatedBatch = await Batch.findById(batch._id)
      .populate('teacher', 'name')
      .populate('subject', 'name code color');

    return ApiResponse.created(res, {
      message: 'Batch created successfully',
      data: populatedBatch,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a batch
 * @route   PUT /api/admin/batches/:id
 */
const updateBatch = async (req, res, next) => {
  try {
    const { teacherId, subjectId, ...updateData } = req.body;

    const batch = await Batch.findById(req.params.id);
    if (!batch) throw ApiError.notFound('Batch not found');

    // Handle teacher change
    if (teacherId && String(batch.teacher) !== teacherId) {
      // Remove batch from old teacher
      await Teacher.findOneAndUpdate(
        { user: batch.teacher },
        { $pull: { batches: batch._id } }
      );
      // Add batch to new teacher
      await Teacher.findOneAndUpdate(
        { user: teacherId },
        { $addToSet: { batches: batch._id } }
      );
      updateData.teacher = teacherId;
    }

    if (subjectId !== undefined) updateData.subject = subjectId;

    // Re-name "COURSECODE-LABEL" from the (possibly changed) course
    const courseId = subjectId !== undefined ? subjectId : batch.subject;
    const course = courseId ? await Subject.findById(courseId) : null;
    if (course?.code && updateData.name !== undefined) {
      updateData.name = buildBatchName(updateData.name, course.code);
    }

    const updatedBatch = await Batch.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('teacher', 'name')
      .populate('subject', 'name code color')
      .populate('children', 'name class');

    return ApiResponse.success(res, { message: 'Batch updated', data: updatedBatch });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete (deactivate) a batch
 * @route   DELETE /api/admin/batches/:id
 */
const deleteBatch = async (req, res, next) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) throw ApiError.notFound('Batch not found');

    // Remove this batch from its teacher's batch list
    if (batch.teacher) {
      await Teacher.findOneAndUpdate({ user: batch.teacher }, { $pull: { batches: batch._id } });
    }

    // Unassign any students in this batch (clear the derived class + course code)
    await Child.updateMany(
      { batch: batch._id },
      { $unset: { batch: 1 }, $set: { class: '', section: '' } }
    );

    await Batch.findByIdAndDelete(batch._id);

    return ApiResponse.success(res, { message: 'Batch deleted' });
  } catch (error) {
    next(error);
  }
};

// ==================== SUBJECT MANAGEMENT ====================

/**
 * @desc    Get all subjects
 * @route   GET /api/admin/subjects
 */
const getSubjects = async (req, res, next) => {
  try {
    const subjects = await Subject.find({ isActive: true }).sort('name');
    return ApiResponse.success(res, { data: subjects });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a subject
 * @route   POST /api/admin/subjects
 */
const createSubject = async (req, res, next) => {
  try {
    const subject = await Subject.create(req.body);
    return ApiResponse.created(res, { message: 'Subject created', data: subject });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a subject
 * @route   PUT /api/admin/subjects/:id
 */
const updateSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!subject) throw ApiError.notFound('Subject not found');
    return ApiResponse.success(res, { message: 'Subject updated', data: subject });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete (deactivate) a subject
 * @route   DELETE /api/admin/subjects/:id
 */
const deleteSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) throw ApiError.notFound('Course not found');

    // Detach from teachers and batches that reference this course
    await Teacher.updateMany({ subjects: subject._id }, { $pull: { subjects: subject._id } });
    await Batch.updateMany({ subject: subject._id }, { $unset: { subject: 1 } });

    await Subject.findByIdAndDelete(subject._id);

    return ApiResponse.success(res, { message: 'Course deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // Parents
  getParents,
  getParent,
  createParent,
  updateParent,
  deleteParent,
  // Teachers
  getTeachers,
  getTeacher,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  // Children
  getChildren,
  getChild,
  createChild,
  updateChild,
  deleteChild,
  // Batches
  getBatches,
  createBatch,
  updateBatch,
  deleteBatch,
  // Subjects
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
};
