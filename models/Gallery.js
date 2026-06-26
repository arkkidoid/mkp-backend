const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Gallery title is required'],
      trim: true,
    },
    description: String,
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    media: [
      {
        url: { type: String, required: true },
        type: {
          type: String,
          enum: ['image', 'video'],
          required: true,
        },
        thumbnail: String,
        caption: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    albumType: {
      type: String,
      enum: ['classroom_moment', 'event', 'activity', 'general'],
      default: 'classroom_moment',
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

gallerySchema.index({ batch: 1 });
gallerySchema.index({ uploadedBy: 1 });
gallerySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Gallery', gallerySchema);
