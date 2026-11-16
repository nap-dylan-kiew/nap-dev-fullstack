// Model: the Loan table. Renting and returning each touch TWO tables (Loan and
// BookCopy), so each one is a transaction: both writes are saved, or neither is.
const sql = require('mssql');
const dbConfig = require('../dbConfig');
const bookCopyModel = require('./bookCopyModel');

async function closeQuietly(connection) {
  if (connection) {
    try {
      await connection.close();
    } catch (closeErr) {
      console.error('Error closing connection:', closeErr);
    }
  }
}

// Rent a copy: insert a Loan, then set the copy's Status to 'M'.
// LoanNo is IDENTITY, so we do NOT supply it. OUTPUT INSERTED.LoanNo gets it back.
// RentalRate is copied from the BookCopy at rent time. DateDue is 7 days after DateOut.
// DateOut is the current minute rounded DOWN, so smalldatetime cannot round it past
// GETDATE() and fail CHECK (DateOut <= GETDATE()).
// Returns the new loan, or null if the copy was taken by someone else in the meantime.
async function rent(isbn, copyNo, memberId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const transaction = new sql.Transaction(connection);
    await transaction.begin();
    try {
      const request = transaction.request();
      request.input('isbn', sql.Char(10), isbn);
      request.input('copyNo', sql.TinyInt, copyNo);
      request.input('memberId', sql.SmallInt, memberId);
      const result = await request.query(
        `INSERT INTO Loan (DateOut, DateDue, RentalRate, ISBN, CopyNo, MemberID)
         OUTPUT INSERTED.LoanNo, INSERTED.DateOut, INSERTED.DateDue, INSERTED.RentalRate
         SELECT DATEADD(MINUTE, DATEDIFF(MINUTE, 0, GETDATE()), 0),
                DATEADD(DAY, 7, DATEADD(MINUTE, DATEDIFF(MINUTE, 0, GETDATE()), 0)),
                RentalRate, ISBN, CopyNo, @memberId
         FROM BookCopy
         WHERE ISBN = @isbn AND CopyNo = @copyNo`
      );
      const changed = await bookCopyModel.markRented(isbn, copyNo, transaction);
      if (changed === 0) {
        await transaction.rollback();
        return null;
      }
      await transaction.commit();
      return result.recordset[0];
    } catch (txErr) {
      await transaction.rollback();
      throw txErr;
    }
  } finally {
    await closeQuietly(connection);
  }
}

// Return a copy: fill in DateReturn on the open loan, then put the copy back to 'D'.
// An open loan is one where DateReturn IS NULL.
// Returns the loan, or null if that copy has no open loan.
async function giveBack(isbn, copyNo) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const transaction = new sql.Transaction(connection);
    await transaction.begin();
    try {
      const request = transaction.request();
      request.input('isbn', sql.Char(10), isbn);
      request.input('copyNo', sql.TinyInt, copyNo);
      const result = await request.query(
        `UPDATE Loan
         SET DateReturn = DATEADD(MINUTE, DATEDIFF(MINUTE, 0, GETDATE()), 0)
         OUTPUT INSERTED.LoanNo, INSERTED.DateOut, INSERTED.DateDue, INSERTED.DateReturn
         WHERE ISBN = @isbn AND CopyNo = @copyNo AND DateReturn IS NULL`
      );
      if (result.rowsAffected[0] === 0) {
        await transaction.rollback();
        return null;
      }
      await bookCopyModel.markReturned(isbn, copyNo, transaction);
      await transaction.commit();
      return result.recordset[0];
    } catch (txErr) {
      await transaction.rollback();
      throw txErr;
    }
  } finally {
    await closeQuietly(connection);
  }
}

module.exports = { rent, giveBack };
