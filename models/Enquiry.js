const mongoose = require('mongoose');

/**
 * Admission / enrollment enquiry submitted from the public "Explore School"
 * (guest) section of the app. Captured as a lead for the MKP team to follow up.
 */
const enquirySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 100,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, trim: true },
    // Course/programme the visitor is interested in (free text or course name)
    interestedIn: { type: String, trim: true },
    message: { type: String, trim: true, maxlength: 1000 },
    status: {
      type: String,
      enum: ['new', 'contacted', 'closed'],
      default: 'new',
    },
    source: { type: String, default: 'app-guest' },
  },
  { timestamps: true }
);

enquirySchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Enquiry', enquirySchema);
