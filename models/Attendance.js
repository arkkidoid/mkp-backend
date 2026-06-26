const mongoose = require('mongoose');
const { ATTENDANCE_STATUS } = require('../utils/constants');

const attendanceSchema = new mongoose.Schema(
  {
    child: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Child',
      required: [true, 'Child is required'],
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      required: [true, 'Batch is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    status: {
      type: String,
      enum: Object.values(ATTENDANCE_STATUS),
      required: [true, 'Status is required'],
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    remarks: {
      type: String,
      trim: true,
    },
    arrivalTime: Date,
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate attendance entries
attendanceSchema.index({ child: 1, batch: 1, date: 1 }, { unique: true });
attendanceSchema.index({ batch: 1, date: 1 });
attendanceSchema.index({ child: 1, date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
