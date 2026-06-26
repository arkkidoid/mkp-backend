const mongoose = require('mongoose');

const parentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    children: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Child',
      },
    ],
    occupation: {
      type: String,
      trim: true,
    },
    emergencyContacts: [
      {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        relation: { type: String, required: true },
      },
    ],
    notificationPreferences: {
      attendance: { type: Boolean, default: true },
      assignments: { type: Boolean, default: true },
      fees: { type: Boolean, default: true },
      events: { type: Boolean, default: true },
      announcements: { type: Boolean, default: true },
      gallery: { type: Boolean, default: true },
      chat: { type: Boolean, default: true },
    },
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

// Virtual for children count
parentSchema.virtual('childrenCount').get(function () {
  return this.children ? this.children.length : 0;
});

parentSchema.index({ user: 1 });

module.exports = mongoose.model('Parent', parentSchema);
