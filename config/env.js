const Joi = require('joi');
const logger = require('../utils/logger');

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(5001),
  MONGODB_URI: Joi.string().required().description('MongoDB connection string'),
  JWT_SECRET: Joi.string().required().min(32).description('JWT secret key'),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().required().min(32).description('JWT refresh secret key'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  OTP_EXPIRY_MINUTES: Joi.number().default(5),
  CLOUDINARY_CLOUD_NAME: Joi.string().optional(),
  CLOUDINARY_API_KEY: Joi.string().optional(),
  CLOUDINARY_API_SECRET: Joi.string().optional(),
  FIREBASE_PROJECT_ID: Joi.string().optional(),
  FIREBASE_CLIENT_EMAIL: Joi.string().optional(),
  FIREBASE_PRIVATE_KEY: Joi.string().optional(),
  CLIENT_URL: Joi.string().default('http://localhost:3000'),
  ADMIN_URL: Joi.string().default('http://localhost:5173'),
  RATE_LIMIT_WINDOW_MS: Joi.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),
}).unknown(true);

const validateEnv = () => {
  const { error, value } = envSchema.validate(process.env, {
    abortEarly: false,
    stripUnknown: false,
  });

  if (error) {
    const missingVars = error.details.map((d) => d.message).join('\n  - ');
    logger.error(`Environment validation failed:\n  - ${missingVars}`);

    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }

  return value;
};

module.exports = { validateEnv };
