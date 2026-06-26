const mongoose = require('mongoose');
const { LEAVE_STATUS } = require('../utils/constants');

const leaveRequestSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
    },
    leaveType: {
      type: String,
      enum: ['sick', 'casual', 'earned', 'personal', 'other'],
      default: 'casual',
    },
    status: {
      type: String,
      enum: Object.values(LEAVE_STATUS),
      default: LEAVE_STATUS.PENDING,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: Date,
    adminRemarks: String,
    attachments: [
      {
        url: String,
        name: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

leaveRequestSchema.index({ teacher: 1, status: 1 });

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);
