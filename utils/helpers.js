const crypto = require('crypto');

/**
 * Generate a random OTP of specified length
 */
const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[crypto.randomInt(0, digits.length)];
  }
  return otp;
};

/**
 * Calculate age from date of birth
 */
const calculateAge = (dob) => {
  const diff = Date.now() - new Date(dob).getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

/**
 * Build pagination options from query params
 */
const getPaginationOptions = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const skip = (page - 1) * limit;
  const sort = query.sort || '-createdAt';

  return { page, limit, skip, sort };
};

/**
 * Build search filter from query string
 */
const buildSearchFilter = (query, searchFields = []) => {
  const filter = {};

  if (query.search && searchFields.length > 0) {
    filter.$or = searchFields.map((field) => ({
      [field]: { $regex: query.search, $options: 'i' },
    }));
  }

  return filter;
};

/**
 * Get start and end of a day (for date queries)
 */
const getDayBounds = (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

/**
 * Get start and end of a month
 */
const getMonthBounds = (year, month) => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
};

module.exports = {
  generateOTP,
  calculateAge,
  getPaginationOptions,
  buildSearchFilter,
  getDayBounds,
  getMonthBounds,
};
