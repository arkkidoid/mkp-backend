const Joi = require('joi');

const createChild = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  dateOfBirth: Joi.date().max('now').required(),
  gender: Joi.string().valid('male', 'female', 'other').required(),
  class: Joi.string().required(),
  section: Joi.string().optional(),
  parentId: Joi.string().hex().length(24).required(),
  batchId: Joi.string().hex().length(24).optional(),
  teacherId: Joi.string().hex().length(24).optional(),
  admissionNumber: Joi.string().optional(),
  bloodGroup: Joi.string()
    .valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', '')
    .optional(),
  allergies: Joi.array().items(Joi.string()).optional(),
  medicalNotes: Joi.string().optional(),
  emergencyContact: Joi.object({
    name: Joi.string().required(),
    phone: Joi.string().required(),
    relation: Joi.string().required(),
  }).optional(),
});

const updateChild = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  dateOfBirth: Joi.date().max('now').optional(),
  gender: Joi.string().valid('male', 'female', 'other').optional(),
  class: Joi.string().optional(),
  section: Joi.string().optional(),
  batchId: Joi.string().hex().length(24).optional().allow(null),
  teacherId: Joi.string().hex().length(24).optional().allow(null),
  bloodGroup: Joi.string()
    .valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', '')
    .optional(),
  allergies: Joi.array().items(Joi.string()).optional(),
  medicalNotes: Joi.string().optional().allow(''),
  emergencyContact: Joi.object({
    name: Joi.string().required(),
    phone: Joi.string().required(),
    relation: Joi.string().required(),
  }).optional(),
}).min(1);

module.exports = { createChild, updateChild };
