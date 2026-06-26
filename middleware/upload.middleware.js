const multer = require('multer');
const path = require('path');
const ApiError = require('../utils/apiError');
const { UPLOAD } = require('../utils/constants');

// Memory storage for Cloudinary uploads
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    ...UPLOAD.ALLOWED_IMAGE_TYPES,
    ...UPLOAD.ALLOWED_DOCUMENT_TYPES,
    ...UPLOAD.ALLOWED_VIDEO_TYPES,
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      ApiError.badRequest(
        `File type ${file.mimetype} is not supported. Allowed: images, PDFs, and videos.`
      ),
      false
    );
  }
};

// Single file upload
const uploadSingle = multer({
  storage,
  fileFilter,
  limits: { fileSize: UPLOAD.MAX_FILE_SIZE },
}).single('file');

// Multiple files upload (max 10)
const uploadMultiple = multer({
  storage,
  fileFilter,
  limits: { fileSize: UPLOAD.MAX_FILE_SIZE },
}).array('files', 10);

// Avatar upload (images only)
const uploadAvatar = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (UPLOAD.ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(ApiError.badRequest('Only image files are allowed for avatars'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB for avatars
}).single('avatar');

module.exports = { uploadSingle, uploadMultiple, uploadAvatar };
