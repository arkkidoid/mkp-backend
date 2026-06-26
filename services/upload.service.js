const { cloudinary } = require('../config/cloudinary');
const logger = require('../utils/logger');
const ApiError = require('../utils/apiError');

class UploadService {
  /**
   * Upload a file buffer to Cloudinary
   */
  static async uploadFile(fileBuffer, options = {}) {
    const {
      folder = 'ark-kidoid',
      resourceType = 'auto',
      transformation = [],
    } = options;

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
          transformation,
        },
        (error, result) => {
          if (error) {
            logger.error('Cloudinary upload error:', error);
            reject(ApiError.internal('File upload failed'));
          } else {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              format: result.format,
              size: result.bytes,
              width: result.width,
              height: result.height,
            });
          }
        }
      );

      uploadStream.end(fileBuffer);
    });
  }

  /**
   * Upload avatar with automatic resize
   */
  static async uploadAvatar(fileBuffer) {
    return this.uploadFile(fileBuffer, {
      folder: 'ark-kidoid/avatars',
      transformation: [
        { width: 300, height: 300, crop: 'fill', gravity: 'face' },
        { quality: 'auto' },
      ],
    });
  }

  /**
   * Upload gallery image
   */
  static async uploadGalleryImage(fileBuffer) {
    return this.uploadFile(fileBuffer, {
      folder: 'ark-kidoid/gallery',
      transformation: [
        { width: 1200, height: 900, crop: 'limit' },
        { quality: 'auto' },
      ],
    });
  }

  /**
   * Upload document (PDF, etc.)
   */
  static async uploadDocument(fileBuffer) {
    return this.uploadFile(fileBuffer, {
      folder: 'ark-kidoid/documents',
      resourceType: 'raw',
    });
  }

  /**
   * Delete file from Cloudinary
   */
  static async deleteFile(publicId, resourceType = 'image') {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });
      return result;
    } catch (error) {
      logger.error('Cloudinary delete error:', error);
      throw ApiError.internal('File deletion failed');
    }
  }
}

module.exports = UploadService;
