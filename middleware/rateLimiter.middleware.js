const rateLimit = require('express-rate-limit');

const IS_DEV = process.env.NODE_ENV !== 'production';

// In dev/test, rate limits are relaxed significantly to allow free testing
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: IS_DEV ? 10000 : (parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100),
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: IS_DEV ? 500 : 10, // 500 in dev, 10 in prod
  message: { success: false, message: 'Too many login attempts, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: IS_DEV ? 100 : 3, // unlimited in dev
  message: { success: false, message: 'Too many OTP requests, please try again after 1 minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { apiLimiter, authLimiter, otpLimiter };
