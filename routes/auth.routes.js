const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const { authLimiter, otpLimiter } = require('../middleware/rateLimiter.middleware');
const authValidator = require('../validators/auth.validator');

// Public routes
router.post('/send-otp', otpLimiter, validate(authValidator.sendOTP), authController.sendOTP);
router.post('/verify-otp', authLimiter, validate(authValidator.verifyOTP), authController.verifyOTP);
router.post('/phone-login', authLimiter, validate(authValidator.phoneLogin), authController.phoneLogin);
router.post('/admin-login', authLimiter, validate(authValidator.adminLogin), authController.adminLogin);
router.post('/login', authLimiter, validate(authValidator.login), authController.login);
router.post('/refresh-token', validate(authValidator.refreshToken), authController.refreshToken);

// Protected routes
router.use(protect);
router.post('/logout', authController.logout);
router.post('/logout-all', authController.logoutAll);
router.get('/me', authController.getMe);
router.put('/me', authController.updateMe);
router.put('/change-password', validate(authValidator.changePassword), authController.changePassword);
router.post('/fcm-token', authController.registerFCMToken);

module.exports = router;
