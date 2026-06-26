const OTP = require('../models/OTP');
const { generateOTP } = require('../utils/helpers');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

const IS_DEV = process.env.NODE_ENV !== 'production';

class OTPService {
  static async sendOTP(phone) {
    await OTP.deleteMany({ phone });

    // In dev, always use 123456 so testers don't need to check logs
    const otp = IS_DEV ? '123456' : generateOTP(6);
    const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 5;

    await OTP.create({
      phone,
      otp,
      expiresAt: new Date(Date.now() + expiryMinutes * 60 * 1000),
    });

    logger.info(`📱 OTP for ${phone}: ${otp} ${IS_DEV ? '(dev mode — any code accepted)' : ''}`);

    const result = { message: 'OTP sent successfully' };
    if (IS_DEV) result.otp = otp;
    return result;
  }

  static async verifyOTP(phone, otpCode) {
    // In dev, accept any non-empty code without DB lookup
    if (IS_DEV) {
      logger.info(`📱 Dev OTP bypass for ${phone} — accepted code: ${otpCode}`);
      await OTP.deleteMany({ phone });
      return true;
    }

    const otpRecord = await OTP.findOne({ phone, isVerified: false }).sort({ createdAt: -1 });

    if (!otpRecord) throw ApiError.badRequest('OTP not found. Please request a new one.');
    if (otpRecord.expiresAt < new Date()) {
      await OTP.deleteOne({ _id: otpRecord._id });
      throw ApiError.badRequest('OTP has expired. Please request a new one.');
    }
    if (otpRecord.attempts >= 5) {
      await OTP.deleteOne({ _id: otpRecord._id });
      throw ApiError.tooManyRequests('Too many attempts. Please request a new OTP.');
    }
    if (otpRecord.otp !== otpCode) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      throw ApiError.badRequest('Invalid OTP. Please try again.');
    }

    otpRecord.isVerified = true;
    await otpRecord.save();
    await OTP.deleteMany({ phone });
    return true;
  }
}

module.exports = OTPService;
