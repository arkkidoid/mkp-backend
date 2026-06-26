const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const ApiError = require('../utils/apiError');

class AuthService {
  /**
   * Generate JWT access token
   */
  static generateAccessToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    });
  }

  /**
   * Generate JWT refresh token
   */
  static generateRefreshToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });
  }

  /**
   * Generate both tokens and save refresh token to user
   */
  static async generateTokens(user, device = 'unknown') {
    const accessToken = this.generateAccessToken(user._id);
    const refreshToken = this.generateRefreshToken(user._id);

    // Calculate refresh token expiry
    const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    const days = parseInt(refreshExpiresIn);
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    // Save refresh token to user
    await User.findByIdAndUpdate(user._id, {
      $push: {
        refreshTokens: {
          token: refreshToken,
          device,
          expiresAt,
        },
      },
      lastLogin: new Date(),
    });

    return { accessToken, refreshToken };
  }

  /**
   * Verify and refresh tokens
   */
  static async refreshTokens(refreshToken, device = 'unknown') {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

      const user = await User.findOne({
        _id: decoded.id,
        'refreshTokens.token': refreshToken,
        isActive: true,
      }).select('+refreshTokens');

      if (!user) {
        throw ApiError.unauthorized('Invalid refresh token');
      }

      // Remove old refresh token
      await User.findByIdAndUpdate(user._id, {
        $pull: { refreshTokens: { token: refreshToken } },
      });

      // Generate new token pair
      return this.generateTokens(user, device);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        // Clean up expired token
        await User.updateMany(
          {},
          { $pull: { refreshTokens: { token: refreshToken } } }
        );
        throw ApiError.unauthorized('Refresh token expired. Please login again.');
      }
      throw error;
    }
  }

  /**
   * Revoke a specific refresh token (logout)
   */
  static async revokeToken(userId, refreshToken) {
    await User.findByIdAndUpdate(userId, {
      $pull: { refreshTokens: { token: refreshToken } },
    });
  }

  /**
   * Revoke all refresh tokens (logout all devices)
   */
  static async revokeAllTokens(userId) {
    await User.findByIdAndUpdate(userId, {
      $set: { refreshTokens: [] },
    });
  }

  /**
   * Clean up expired refresh tokens
   */
  static async cleanupExpiredTokens(userId) {
    await User.findByIdAndUpdate(userId, {
      $pull: { refreshTokens: { expiresAt: { $lt: new Date() } } },
    });
  }
}

module.exports = AuthService;
