const Joi = require('joi');

const sendOTP = Joi.object({
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
      'string.pattern.base': 'Please provide a valid 10-digit Indian mobile number',
      'any.required': 'Phone number is required',
    }),
});

const verifyOTP = Joi.object({
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
      'string.pattern.base': 'Please provide a valid 10-digit Indian mobile number',
    }),
  otp: Joi.string()
    .length(6)
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      'string.length': 'OTP must be exactly 6 digits',
      'any.required': 'OTP is required',
    }),
  device: Joi.string().optional().default('unknown'),
});

const phoneLogin = Joi.object({
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
      'string.pattern.base': 'Please provide a valid 10-digit Indian mobile number',
      'any.required': 'Phone number is required',
    }),
  accessCode: Joi.string()
    .length(6)
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      'string.length': 'Access code must be exactly 6 digits',
      'string.pattern.base': 'Access code must be exactly 6 digits',
      'any.required': 'Access code is required',
    }),
  device: Joi.string().optional().default('unknown'),
});

const login = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters',
    'any.required': 'Password is required',
  }),
  device: Joi.string().optional().default('unknown'),
});

const register = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().optional(),
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('admin', 'teacher', 'parent').required(),
  device: Joi.string().optional().default('unknown'),
});

const refreshToken = Joi.object({
  refreshToken: Joi.string().required().messages({
    'any.required': 'Refresh token is required',
  }),
  device: Joi.string().optional().default('unknown'),
});

const forgotPassword = Joi.object({
  email: Joi.string().email().required(),
});

const resetPassword = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(6).required(),
});

const changePassword = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required().disallow(Joi.ref('currentPassword'))
    .messages({
      'any.invalid': 'New password must be different from current password',
    }),
});

module.exports = {
  sendOTP,
  verifyOTP,
  phoneLogin,
  login,
  register,
  refreshToken,
  forgotPassword,
  resetPassword,
  changePassword,
};
