const Joi = require('joi');

// Rules for POST /members. They mirror the Member table in NP Bookstore.
const memberSchema = Joi.object({
  name: Joi.string().max(50).required(),
  address: Joi.string().max(150).allow('', null),
  contactNo: Joi.string().max(10).allow('', null),
  emailAddr: Joi.string().email().max(50).required(),
  gender: Joi.string().valid('M', 'F').allow('', null),
  branchNo: Joi.number().integer().min(1).default(1),
});

module.exports = memberSchema;
