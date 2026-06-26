const mongoose = require('mongoose');
const { FEE_STATUS } = require('../utils/constants');

const feeSchema = new mongoose.Schema(
  {
    child: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Child',
      required: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Fee title is required'],
      trim: true,
    },
    description: String,
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    finalAmount: {
      type: Number,
      required: true,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    status: {
      type: String,
      enum: Object.values(FEE_STATUS),
      default: FEE_STATUS.PENDING,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    paidDate: Date,
    academicYear: String,
    month: String,
    feeType: {
      type: String,
      enum: ['tuition', 'transport', 'activity', 'exam', 'other'],
      default: 'tuition',
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

feeSchema.index({ child: 1, status: 1 });
feeSchema.index({ parent: 1, status: 1 });
feeSchema.index({ dueDate: 1 });

module.exports = mongoose.model('Fee', feeSchema);
