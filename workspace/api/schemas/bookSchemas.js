const Joi = require('joi');

// Search, sort and paging for GET /books. Every key is optional.
// req.query values always arrive as strings. Joi converts page and limit to numbers.
const bookQuerySchema = Joi.object({
  title: Joi.string().max(200),
  bookCat: Joi.string().valid('C', 'F', 'NF'),
  sort: Joi.string().valid('title', 'year').default('title'),
  order: Joi.string().valid('asc', 'desc').default('asc'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
});

// :isbn in the path.
const isbnParamSchema = Joi.object({
  isbn: Joi.string().pattern(/^[0-9]{9}[0-9X]$/).required(),
});

// Body of POST /books/:isbn/copies. The ISBN comes from the URL, not the body.
const newCopySchema = Joi.object({
  copyNo: Joi.number().integer().min(1).max(255).required(),
  rentalRate: Joi.number().min(2.5).required(),
});

// Body of POST /books: the book, its first copy's rate, and optionally who wrote it.
const newBookSchema = Joi.object({
  isbn: Joi.string().pattern(/^[0-9]{9}[0-9X]$/).required(),
  title: Joi.string().max(200).required(),
  yearPublish: Joi.string().pattern(/^[0-9]{4}$/).required(),
  publisherId: Joi.number().integer().min(1),
  bookCat: Joi.string().valid('C', 'F', 'NF'),
  authorId: Joi.number().integer().min(1),
  rentalRate: Joi.number().min(2.5).required(),
});

// One schema checks the pair together: a copy is identified by isbn AND copyNo.
const copySchema = Joi.object({
  isbn: Joi.string().length(10).required(),
  copyNo: Joi.number().integer().min(1).max(255).required(),
});

// Renting also needs to know who is renting.
const rentSchema = Joi.object({
  isbn: Joi.string().length(10).required(),
  copyNo: Joi.number().integer().min(1).max(255).required(),
  memberId: Joi.number().integer().min(1).required(),
});

module.exports = {
  bookQuerySchema,
  isbnParamSchema,
  newCopySchema,
  newBookSchema,
  copySchema,
  rentSchema,
};
