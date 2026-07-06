const mongoose = require('mongoose');
const { DAYS } = require('../utils/constants');

const batchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Batch name is required'],
      trim: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Teacher is required'],
    },
    // Venue / place where this batch's sessions are held (a teacher may run
    // batches at several locations)
    location: {
      type: String,
      trim: true,
    },
    classroom: {
      type: String,
      trim: true,
    },
    schedule: [
      {
        day: {
          type: String,
          enum: DAYS,
          required: true,
        },
        startTime: {
          type: String,
          required: true,
        },
        endTime: {
          type: String,
          required: true,
        },
      },
    ],
    capacity: {
      type: Number,
      default: 30,
    },
    children: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Child',
      },
    ],
    academicYear: {
      type: String,
      default: () => {
        const now = new Date();
        const year = now.getFullYear();
        return now.getMonth() >= 3 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
      },
    },
    description: String,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for student count
batchSchema.virtual('studentCount').get(function () {
  return this.children ? this.children.length : 0;
});

// Virtual for available seats
batchSchema.virtual('availableSeats').get(function () {
  return this.capacity - (this.children ? this.children.length : 0);
});

batchSchema.index({ teacher: 1 });
batchSchema.index({ isActive: 1 });

module.exports = mongoose.model('Batch', batchSchema);
