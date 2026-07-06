const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Course name is required'],
      trim: true,
      unique: true,
    },
    code: {
      type: String,
      required: [true, 'Course code is required'],
      trim: true,
      uppercase: true,
      unique: true,
      sparse: true,
    },
    description: {
      type: String,
      trim: true,
    },
    // ── Fees (COD — collected offline, tracked here) ──
    monthlyFee: {
      type: Number,
      default: 0,
      min: [0, 'Monthly fee cannot be negative'],
    },
    admissionFee: {
      type: Number,
      default: 0,
      min: [0, 'Admission fee cannot be negative'],
    },
    // ── Course details ──
    duration: { type: String, trim: true },   // e.g. "3 months", "Ongoing"
    ageGroup: { type: String, trim: true },    // e.g. "5-12 years"
    level: { type: String, trim: true },       // e.g. "Beginner"
    icon: {
      type: String, // icon name or URL
    },
    color: {
      type: String, // hex color for UI
      default: '#F47A3A',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subject', subjectSchema);
