/**
 * Application constants
 */
module.exports = {
  ROLES: {
    ADMIN: 'admin',
    TEACHER: 'teacher',
    PARENT: 'parent',
  },

  ATTENDANCE_STATUS: {
    PRESENT: 'present',
    ABSENT: 'absent',
    LATE: 'late',
    HOLIDAY: 'holiday',
  },

  GENDER: {
    MALE: 'male',
    FEMALE: 'female',
    OTHER: 'other',
  },

  DAYS: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],

  CHAT_MESSAGE_TYPES: {
    TEXT: 'text',
    IMAGE: 'image',
    PDF: 'pdf',
    VOICE: 'voice',
  },

  NOTIFICATION_TYPES: {
    ATTENDANCE: 'attendance',
    ASSIGNMENT: 'assignment',
    FEE: 'fee',
    EVENT: 'event',
    ANNOUNCEMENT: 'announcement',
    GALLERY: 'gallery',
    CHAT: 'chat',
    GENERAL: 'general',
  },

  LEAVE_STATUS: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
  },

  FEE_STATUS: {
    PENDING: 'pending',
    PAID: 'paid',
    PARTIAL: 'partial',
    OVERDUE: 'overdue',
  },

  PAYMENT_STATUS: {
    PENDING: 'pending',
    SUCCESS: 'success',
    FAILED: 'failed',
    REFUNDED: 'refunded',
  },

  EVENT_TYPES: {
    SPORTS: 'sports',
    MEETING: 'meeting',
    HOLIDAY: 'holiday',
    COMPETITION: 'competition',
    FUNCTION: 'function',
    OTHER: 'other',
  },

  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },

  // Upload limits
  UPLOAD: {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    ALLOWED_DOCUMENT_TYPES: ['application/pdf'],
    ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/quicktime'],
  },
};
