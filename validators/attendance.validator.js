const Joi = require('joi');
const { ATTENDANCE_STATUS } = require('../utils/constants');

const markAttendance = Joi.object({
  batchId: Joi.string().hex().length(24).required(),
  date: Joi.date().max('now').required(),
  records: Joi.array()
    .items(
      Joi.object({
        childId: Joi.string().hex().length(24).required(),
        status: Joi.string()
          .valid(...Object.values(ATTENDANCE_STATUS))
          .required(),
        remarks: Joi.string().optional().allow(''),
        arrivalTime: Joi.date().optional(),
      })
    )
    .min(1)
    .required(),
});

const getAttendance = Joi.object({
  childId: Joi.string().hex().length(24).optional(),
  batchId: Joi.string().hex().length(24).optional(),
  date: Joi.date().optional(),
  month: Joi.number().min(1).max(12).optional(),
  year: Joi.number().min(2020).max(2030).optional(),
  status: Joi.string()
    .valid(...Object.values(ATTENDANCE_STATUS))
    .optional(),
});

module.exports = { markAttendance, getAttendance };
