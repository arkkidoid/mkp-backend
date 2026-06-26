const Joi = require('joi');
const { DAYS } = require('../utils/constants');

const createBatch = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  subjectId: Joi.string().hex().length(24).optional(),
  teacherId: Joi.string().hex().length(24).required(),
  classroom: Joi.string().optional(),
  schedule: Joi.array()
    .items(
      Joi.object({
        day: Joi.string()
          .valid(...DAYS)
          .required(),
        startTime: Joi.string()
          .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
          .required()
          .messages({ 'string.pattern.base': 'Time must be in HH:MM format' }),
        endTime: Joi.string()
          .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
          .required(),
      })
    )
    .optional(),
  capacity: Joi.number().min(1).max(200).optional().default(30),
  description: Joi.string().optional(),
  academicYear: Joi.string().optional(),
});

const updateBatch = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  subjectId: Joi.string().hex().length(24).optional().allow(null),
  teacherId: Joi.string().hex().length(24).optional(),
  classroom: Joi.string().optional().allow(''),
  schedule: Joi.array()
    .items(
      Joi.object({
        day: Joi.string()
          .valid(...DAYS)
          .required(),
        startTime: Joi.string()
          .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
          .required(),
        endTime: Joi.string()
          .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
          .required(),
      })
    )
    .optional(),
  capacity: Joi.number().min(1).max(200).optional(),
  description: Joi.string().optional().allow(''),
  isActive: Joi.boolean().optional(),
}).min(1);

const addChildren = Joi.object({
  childrenIds: Joi.array()
    .items(Joi.string().hex().length(24))
    .min(1)
    .required(),
});

module.exports = { createBatch, updateBatch, addChildren };
