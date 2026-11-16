// Controller: plain JavaScript, no SQL. Reads the request, validates it,
// calls the Model and decides which response to send.
const Joi = require('joi');
const bookCopyModel = require('../models/bookCopyModel');
const bookModel = require('../models/bookModel');
const memberModel = require('../models/memberModel');
const loanModel = require('../models/loanModel');

// The same rule as CHECK (RentalRate >= 2.50) on BookCopy, one layer earlier.
const rateSchema = Joi.object({
  rentalRate: Joi.number().min(2.5).required(),
});

async function updateRate(req, res) {
  const copyNo = parseInt(req.params.copyNo);
  if (isNaN(copyNo)) {
    return res.status(400).json({ error: 'Invalid copy number' });
  }

  const { error, value } = rateSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const changed = await bookCopyModel.updateRate(req.params.isbn, copyNo, value.rentalRate);
    if (changed === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.status(200).json({
      ISBN: req.params.isbn,
      CopyNo: copyNo,
      RentalRate: value.rentalRate,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Orchestration: the Controller calls the Models in order and decides what each answer means.
// It never runs SQL itself.
//   404: no such copy, or no such member   409: the copy is already rented
async function rentCopy(req, res) {
  const { isbn, copyNo, memberId } = req.validated.body;

  try {
    const available = await bookCopyModel.checkAvailable(isbn, copyNo);
    if (available === null) {
      return res.status(404).json({ error: 'Copy not found' });
    }
    if (!(await memberModel.exists(memberId))) {
      return res.status(404).json({ error: 'Member not found' });
    }
    if (!available) {
      // Do not touch the tables: the copy is already out.
      return res.status(409).json({ error: 'Copy is already rented' });
    }
    // Loan INSERT + copy Status 'M', in one transaction.
    const loan = await loanModel.rent(isbn, copyNo, memberId);
    if (!loan) {
      return res.status(409).json({ error: 'Copy is already rented' });
    }
    res.status(201).json({
      loanNo: loan.LoanNo,
      isbn,
      copyNo,
      memberId,
      dateOut: loan.DateOut,
      dateDue: loan.DateDue,
      rentalRate: loan.RentalRate,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// 404: no such copy, or that copy has no open loan
async function returnCopy(req, res) {
  const { isbn, copyNo } = req.validated.body;

  try {
    const loan = await loanModel.giveBack(isbn, copyNo);
    if (!loan) {
      return res.status(404).json({ error: 'No open loan for that copy' });
    }
    res.status(200).json({
      loanNo: loan.LoanNo,
      isbn,
      copyNo,
      dateReturn: loan.DateReturn,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Every Model call sits inside try / catch, so a failed query gives a clean 500.
async function deleteCopy(req, res) {
  const copyNo = parseInt(req.params.copyNo);
  if (isNaN(copyNo)) {
    return res.status(400).json({ error: 'Invalid copy number' });
  }
  try {
    const deleted = await bookCopyModel.deleteCopy(req.params.isbn, copyNo);
    if (deleted === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// The ISBN comes from the URL (req.params). The copy number and rate come from
// the body (req.body). Both have been validated by the time this runs.
//   404: no such book    409: that copy number already exists    400: bad input (validate)
async function addCopy(req, res) {
  const { isbn } = req.validated.params;
  const { copyNo, rentalRate } = req.validated.body;

  try {
    if (!(await bookModel.exists(isbn))) {
      return res.status(404).json({ error: 'Book not found' });
    }
    await bookCopyModel.addCopy(isbn, copyNo, rentalRate);
    res.status(201).json({ ISBN: isbn, CopyNo: copyNo, RentalRate: rentalRate, Status: 'D' });
  } catch (err) {
    // 2627 = primary key violation: this ISBN already has this CopyNo.
    if (err.number === 2627) {
      return res.status(409).json({ error: 'That copy number already exists for this book' });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { updateRate, rentCopy, returnCopy, deleteCopy, addCopy };
