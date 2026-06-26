const Joi = require('joi');

const createAssignment = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().optional().allow(''),
  batchId: Joi.string().hex().length(24).required(),
  dueDate: Joi.date().min('now').required().messages({
    'date.min': 'Due date must be in the future',
  }),
  instructions: Joi.string().optional().allow(''),
  totalMarks: Joi.number().min(0).optional().default(0),
});

const updateAssignment = Joi.object({
  title: Joi.string().min(3).max(200).optional(),
  description: Joi.string().optional().allow(''),
  dueDate: Joi.date().optional(),
  instructions: Joi.string().optional().allow(''),
  totalMarks: Joi.number().min(0).optional(),
  isActive: Joi.boolean().optional(),
}).min(1);

module.exports = { createAssignment, updateAssignment };
