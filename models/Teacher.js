const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    employeeId: {
      type: String,
      unique: true,
      sparse: true,
    },
    qualification: {
      type: String,
      trim: true,
    },
    experience: {
      type: Number, // years
      default: 0,
    },
    specialization: {
      type: String,
      trim: true,
    },
    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
      },
    ],
    batches: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Batch',
      },
    ],
    documents: [
      {
        name: String,
        url: String,
        type: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    salary: {
      type: Number,
      select: false,
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

// Virtual for batch count
teacherSchema.virtual('batchCount').get(function () {
  return this.batches ? this.batches.length : 0;
});

teacherSchema.index({ isActive: 1 });

module.exports = mongoose.model('Teacher', teacherSchema);
