const mongoose = require('mongoose');
const { GENDER } = require('../utils/constants');

const childSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Child name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required'],
    },
    gender: {
      type: String,
      enum: Object.values(GENDER),
      required: [true, 'Gender is required'],
    },
    photo: {
      type: String,
      default: null,
    },
    // class = derived label "COURSECODE-BATCH" (e.g. "CR-A"); set on enrollment
    class: {
      type: String,
      trim: true,
    },
    // section = course code (e.g. "CR")
    section: {
      type: String,
      trim: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Parent is required'],
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    admissionDate: {
      type: Date,
      default: Date.now,
    },
    admissionNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''],
    },
    allergies: [String],
    medicalNotes: String,
    emergencyContact: {
      name: String,
      phone: String,
      relation: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    archivedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for age
childSchema.virtual('age').get(function () {
  if (!this.dateOfBirth) return null;
  const diff = Date.now() - this.dateOfBirth.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
});

childSchema.index({ parent: 1 });
childSchema.index({ batch: 1 });
childSchema.index({ teacher: 1 });
childSchema.index({ isActive: 1 });

module.exports = mongoose.model('Child', childSchema);
