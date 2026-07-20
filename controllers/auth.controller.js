const User = require('../models/User');
const Parent = require('../models/Parent');
const Teacher = require('../models/Teacher');
const Admin = require('../models/Admin');
const AuthService = require('../services/auth.service');
const OTPService = require('../services/otp.service');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

/**
 * Load the role-specific profile for a user.
 */
const getProfileForUser = async (user) => {
  if (user.role === 'parent') {
    return Parent.findOne({ user: user._id }).populate('children');
  }
  if (user.role === 'teacher') {
    return Teacher.findOne({ user: user._id })
      .populate('batches')
      .populate('subjects', 'name color');
  }
  if (user.role === 'admin') {
    return Admin.findOne({ user: user._id });
  }
  return null;
};

/**
 * Issue tokens + profile and send the standard login response.
 */
const issueSession = async (res, user, device) => {
  const tokens = await AuthService.generateTokens(user, device);
  const profile = await getProfileForUser(user);
  return ApiResponse.success(res, {
    message: 'Login successful',
    data: { user: user.toJSON(), profile, ...tokens },
  });
};

/**
 * @desc    Send OTP to phone number
 * @route   POST /api/auth/send-otp
 * @access  Public
 */
const sendOTP = async (req, res, next) => {
  try {
    const { phone } = req.body;
    const result = await OTPService.sendOTP(phone);
    const data = { message: result.message };
    if (process.env.NODE_ENV !== 'production' && result.otp) data.otp = result.otp;
    return ApiResponse.success(res, { message: result.message, data });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify OTP and login
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
const verifyOTP = async (req, res, next) => {
  try {
    const { phone, otp, device } = req.body;

    await OTPService.verifyOTP(phone, otp);

    const user = await User.findOne({ phone, isActive: true });
    if (!user) {
      throw ApiError.notFound('No account found with this phone number. Please contact your school administrator.');
    }

    return issueSession(res, user, device);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Passwordless login via registered phone number (no OTP)
 * @route   POST /api/auth/phone-login
 * @access  Public
 */
const phoneLogin = async (req, res, next) => {
  try {
    const { phone, accessCode, device } = req.body;

    if (!accessCode) {
      throw ApiError.badRequest('A 6-digit access code is required');
    }

    const user = await User.findOne({ phone, isActive: true }).select('+accessCode');
    if (!user) {
      throw ApiError.notFound('No account found with this phone number. Please contact your school administrator.');
    }
    if (user.role === 'admin') {
      throw ApiError.forbidden('Admins sign in on the web dashboard, not the app.');
    }

    const isMatch = await user.compareAccessCode(accessCode);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid access code');
    }

    return issueSession(res, user, device);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin dashboard login via access code only (no email/password)
 * @route   POST /api/auth/admin-login
 * @access  Public
 */
const adminLogin = async (req, res, next) => {
  try {
    const { accessCode, device } = req.body;
    if (!accessCode) throw ApiError.badRequest('Access code is required');

    // Match the code against any active admin's stored access code
    const admins = await User.find({ role: 'admin', isActive: true }).select('+accessCode');
    for (const admin of admins) {
      if (await admin.compareAccessCode(accessCode)) {
        return issueSession(res, admin, device);
      }
    }
    throw ApiError.unauthorized('Invalid access code');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login with email and password
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password, device } = req.body;

    const user = await User.findOne({ email, isActive: true }).select('+password');
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (!user.password) {
      throw ApiError.unauthorized('Password not set. Please login with OTP.');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    return issueSession(res, user, device);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh-token
 * @access  Public
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token, device } = req.body;
    const tokens = await AuthService.refreshTokens(token, device);

    return ApiResponse.success(res, {
      message: 'Token refreshed',
      data: tokens,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout (revoke refresh token)
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

    if (token) {
      await AuthService.revokeToken(req.user._id, token);
    }

    return ApiResponse.success(res, { message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout from all devices
 * @route   POST /api/auth/logout-all
 * @access  Private
 */
const logoutAll = async (req, res, next) => {
  try {
    await AuthService.revokeAllTokens(req.user._id);
    return ApiResponse.success(res, { message: 'Logged out from all devices' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    let profile = null;
    if (user.role === 'parent') {
      profile = await Parent.findOne({ user: user._id }).populate({
        path: 'children',
        populate: [
          { path: 'batch', select: 'name' },
          { path: 'teacher', select: 'name' },
        ],
      });
    } else if (user.role === 'teacher') {
      profile = await Teacher.findOne({ user: user._id })
        .populate({
          path: 'batches',
          select: 'name subject schedule studentCount',
        })
        .populate('subjects', 'name color');
    } else if (user.role === 'admin') {
      profile = await Admin.findOne({ user: user._id });
    }

    return ApiResponse.success(res, {
      data: { user, profile },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update current user profile
 * @route   PUT /api/auth/me
 * @access  Private
 */
const updateMe = async (req, res, next) => {
  try {
    const { name, email, address } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (address) updateData.address = address;

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    });

    return ApiResponse.success(res, {
      message: 'Profile updated',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Change password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    if (user.password) {
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        throw ApiError.unauthorized('Current password is incorrect');
      }
    }

    user.password = newPassword;
    await user.save();

    // Revoke all tokens and re-issue
    await AuthService.revokeAllTokens(user._id);
    const tokens = await AuthService.generateTokens(user);

    return ApiResponse.success(res, {
      message: 'Password changed successfully',
      data: tokens,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Register FCM token for push notifications
 * @route   POST /api/auth/fcm-token
 * @access  Private
 */
const registerFCMToken = async (req, res, next) => {
  try {
    const { token, device } = req.body;

    // Remove old token for same device
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { fcmTokens: { device } },
    });

    // Add new token
    await User.findByIdAndUpdate(req.user._id, {
      $push: {
        fcmTokens: { token, device, createdAt: new Date() },
      },
    });

    return ApiResponse.success(res, { message: 'FCM token registered' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendOTP,
  verifyOTP,
  phoneLogin,
  adminLogin,
  login,
  refreshToken,
  logout,
  logoutAll,
  getMe,
  updateMe,
  changePassword,
  registerFCMToken,
};
