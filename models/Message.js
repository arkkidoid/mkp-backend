const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Message title is required'],
      trim: true,
    },
    body: {
      type: String,
      required: [true, 'Message body is required'],
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderRole: {
      type: String,
      enum: ['admin', 'teacher'],
      required: true,
    },
    targetType: {
      type: String,
      enum: ['all', 'all_parents', 'all_teachers', 'batch', 'individual'],
      required: true,
    },
    targetBatches: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Batch',
      },
    ],
    targetUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    attachments: [
      {
        url: String,
        name: String,
        type: { type: String },
      },
    ],
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    readBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        readAt: { type: Date, default: Date.now },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ sender: 1 });
messageSchema.index({ targetType: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
