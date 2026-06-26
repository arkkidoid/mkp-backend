const ApiError = require('../utils/apiError');

/**
 * Role-based access control middleware
 * @param  {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Role '${req.user.role}' is not authorized to access this resource`
        )
      );
    }

    next();
  };
};

/**
 * Check if user is admin
 */
const isAdmin = authorize('admin');

/**
 * Check if user is teacher
 */
const isTeacher = authorize('teacher');

/**
 * Check if user is parent
 */
const isParent = authorize('parent');

/**
 * Check if user is admin or teacher
 */
const isAdminOrTeacher = authorize('admin', 'teacher');

module.exports = { authorize, isAdmin, isTeacher, isParent, isAdminOrTeacher };
