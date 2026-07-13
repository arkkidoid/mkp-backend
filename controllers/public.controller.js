/**
 * PUBLIC (no-auth) endpoints for the app's "Explore School" guest section.
 * Read-only, exposes only public-safe fields. Purely additive — nothing here
 * touches the authenticated flows.
 */
const Subject = require('../models/Subject');
const Batch = require('../models/Batch');
const Gallery = require('../models/Gallery');
const Event = require('../models/Event');
const Enquiry = require('../models/Enquiry');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

// GET /api/public/courses
const getCourses = async (req, res, next) => {
  try {
    const courses = await Subject.find({ isActive: true })
      .select('name code description monthlyFee admissionFee duration ageGroup level color icon')
      .sort('name');
    return ApiResponse.success(res, { data: courses });
  } catch (error) {
    next(error);
  }
};

// GET /api/public/batches
const getBatches = async (req, res, next) => {
  try {
    const batches = await Batch.find({ isActive: true })
      .select('name subject schedule location classroom capacity')
      .populate('subject', 'name code color')
      .sort('name');
    return ApiResponse.success(res, { data: batches });
  } catch (error) {
    next(error);
  }
};

// GET /api/public/gallery
const getGallery = async (req, res, next) => {
  try {
    const items = await Gallery.find({ isPublished: true })
      .select('title description media albumType createdAt')
      .sort('-createdAt')
      .limit(40);
    return ApiResponse.success(res, { data: items });
  } catch (error) {
    next(error);
  }
};

// GET /api/public/announcements  (public school events / news)
const getAnnouncements = async (req, res, next) => {
  try {
    const events = await Event.find({ isActive: true })
      .select('title description type startDate endDate location')
      .sort('-startDate')
      .limit(30);
    return ApiResponse.success(res, { data: events });
  } catch (error) {
    next(error);
  }
};

// POST /api/public/enquiry
const submitEnquiry = async (req, res, next) => {
  try {
    const { name, phone, email, address, interestedIn, message } = req.body;
    if (!name || !phone) {
      throw ApiError.badRequest('Please provide your name and phone number');
    }
    if (!/^[6-9]\d{9}$/.test(String(phone))) {
      throw ApiError.badRequest('Please provide a valid 10-digit mobile number');
    }
    const enquiry = await Enquiry.create({ name, phone, email, address, interestedIn, message });
    return ApiResponse.created(res, {
      message: 'Enquiry submitted',
      data: { _id: enquiry._id },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCourses, getBatches, getGallery, getAnnouncements, submitEnquiry };
