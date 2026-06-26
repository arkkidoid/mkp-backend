const mongoose = require('mongoose');
const { CHAT_MESSAGE_TYPES } = require('../utils/constants');

const chatMessageSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(CHAT_MESSAGE_TYPES),
      default: CHAT_MESSAGE_TYPES.TEXT,
    },
    content: {
      type: String,
      trim: true,
    },
    mediaUrl: String,
    mediaName: String,
    mediaDuration: Number, // for voice notes in seconds
    readBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        readAt: { type: Date, default: Date.now },
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

chatMessageSchema.index({ chat: 1, createdAt: -1 });
chatMessageSchema.index({ sender: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
