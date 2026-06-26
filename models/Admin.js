const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    designation: {
      type: String,
      default: 'School Administrator',
    },
    schoolName: {
      type: String,
      required: [true, 'School name is required'],
      trim: true,
    },
    schoolAddress: {
      street: String,
      city: String,
      state: String,
      pincode: String,
    },
    schoolPhone: String,
    schoolEmail: String,
    schoolLogo: String,
    schoolWebsite: String,
    permissions: {
      manageTeachers: { type: Boolean, default: true },
      manageParents: { type: Boolean, default: true },
      manageChildren: { type: Boolean, default: true },
      manageBatches: { type: Boolean, default: true },
      manageFees: { type: Boolean, default: true },
      manageEvents: { type: Boolean, default: true },
      viewReports: { type: Boolean, default: true },
      sendNotifications: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Admin', adminSchema);
