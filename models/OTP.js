const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  attempts: {
    type: Number,
    default: 0,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 }, // TTL - auto cleanup
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

otpSchema.index({ phone: 1 });

module.exports = mongoose.model('OTP', otpSchema);
