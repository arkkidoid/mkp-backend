const ApiError = require('../utils/apiError');

/**
 * Validation middleware factory
 * @param {Object} schema - Joi validation schema
 * @param {string} source - 'body', 'query', or 'params'
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/"/g, ''),
      }));

      return next(ApiError.badRequest('Validation failed', errors));
    }

    // Replace with validated & sanitized values
    req[source] = value;
    next();
  };
};

module.exports = { validate };
