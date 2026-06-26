const mongoose = require('mongoose');
const { EVENT_TYPES } = require('../utils/constants');

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: Object.values(EVENT_TYPES),
      default: EVENT_TYPES.OTHER,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
    },
    location: String,
    isAllDay: {
      type: Boolean,
      default: false,
    },
    targetAudience: {
      type: String,
      enum: ['all', 'parents', 'teachers', 'specific_batches'],
      default: 'all',
    },
    batches: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Batch',
      },
    ],
    coverImage: String,
    attachments: [
      {
        url: String,
        name: String,
        type: { type: String },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

eventSchema.index({ startDate: 1 });
eventSchema.index({ type: 1 });

module.exports = mongoose.model('Event', eventSchema);
