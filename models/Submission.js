const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
    },
    child: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Child',
      required: true,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // parent who submitted
      required: true,
    },
    attachments: [
      {
        url: String,
        type: { type: String },
        name: String,
      },
    ],
    notes: String,
    status: {
      type: String,
      enum: ['submitted', 'reviewed', 'graded', 'resubmit'],
      default: 'submitted',
    },
    grade: String,
    marks: Number,
    teacherRemarks: String,
    reviewedAt: Date,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

submissionSchema.index({ assignment: 1, child: 1 }, { unique: true });

module.exports = mongoose.model('Submission', submissionSchema);
