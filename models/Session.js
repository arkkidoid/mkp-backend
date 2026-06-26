const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
    device: {
      type: String,
      default: 'unknown',
    },
    ip: String,
    userAgent: String,
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index - auto delete expired
    },
  },
  {
    timestamps: true,
  }
);

sessionSchema.index({ user: 1, isActive: 1 });

module.exports = mongoose.model('Session', sessionSchema);
