// Controller: calls the Model and sends the response. No SQL here.
const bookModel = require('../models/bookModel');
const bookCopyModel = require('../models/bookCopyModel');

async function getAuthors(req, res) {
  try {
    const authors = await bookModel.getAuthorsByISBN(req.params.isbn);
    res.status(200).json(authors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// 409: that ISBN is already in Book.  400: the publisher, category or author is not real.
async function create(req, res) {
  try {
    const created = await bookModel.createBook(req.validated.body);
    res.status(201).json(created);
  } catch (err) {
    if (err.number === 2627) {
      return res.status(409).json({ error: 'A book with that ISBN already exists' });
    }
    if (err.number === 547) {
      return res.status(400).json({ error: 'Unknown publisherId, bookCat or authorId' });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// validate(bookQuerySchema, 'query') has already converted page and limit to
// numbers and filled in the defaults.
async function list(req, res) {
  try {
    const books = await bookModel.list(req.validated.query);
    res.status(200).json(books);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Stretch: GET /books/:isbn/availability
async function availability(req, res) {
  const { isbn } = req.validated.params;
  try {
    if (!(await bookModel.exists(isbn))) {
      return res.status(404).json({ error: 'Book not found' });
    }
    const available = await bookCopyModel.countAvailable(isbn);
    res.status(200).json({ ISBN: isbn, Available: available });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { getAuthors, create, list, availability };
