const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true,
    },
    description: String,
    url: {
      type: String,
      required: [true, 'Document URL is required'],
    },
    type: {
      type: String,
      enum: ['pdf', 'image', 'video', 'worksheet', 'link'],
      required: true,
    },
    category: {
      type: String,
      enum: ['study_material', 'worksheet', 'reference', 'other'],
      default: 'study_material',
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fileSize: Number,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

documentSchema.index({ batch: 1, category: 1 });

module.exports = mongoose.model('Document', documentSchema);
