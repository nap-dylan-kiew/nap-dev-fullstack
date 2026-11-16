// Model: every SQL query and every connection for Book lives here.
const sql = require('mssql');
const dbConfig = require('../dbConfig');

// The JOIN lives in the Model. BookAuthor only holds ids, so Author is
// joined in to bring the names along.
async function getAuthorsByISBN(isbn) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input('isbn', sql.Char(10), isbn);
    const result = await request.query(
      `SELECT ba.ISBN, a.AuthorID, a.Name
       FROM BookAuthor ba
       JOIN Author a ON a.AuthorID = ba.AuthorID
       WHERE ba.ISBN = @isbn`
    );
    return result.recordset;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error('Error closing connection:', closeErr);
      }
    }
  }
}

// Adding a book is more than one write, so it is one transaction:
// the Book row, its first copy (CopyNo 1, on the shelf), and the BookAuthor row if an
// author was given. All of them are saved, or none. Each INSERT uses transaction.request().
// DateIn is the current minute rounded DOWN (see loanModel.js for why).
async function createBook(book) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const transaction = new sql.Transaction(connection);
    await transaction.begin();
    try {
      const bookRequest = transaction.request();
      bookRequest.input('isbn', sql.Char(10), book.isbn);
      bookRequest.input('title', sql.VarChar(200), book.title);
      bookRequest.input('yearPublish', sql.Char(4), book.yearPublish);
      bookRequest.input('publisherId', sql.SmallInt, book.publisherId || null);
      bookRequest.input('bookCat', sql.Char(2), book.bookCat || null);
      await bookRequest.query(
        `INSERT INTO Book (ISBN, Title, YearPublish, PublisherID, BookCat)
         VALUES (@isbn, @title, @yearPublish, @publisherId, @bookCat)`
      );

      const copyRequest = transaction.request();
      copyRequest.input('isbn', sql.Char(10), book.isbn);
      copyRequest.input('rentalRate', sql.SmallMoney, book.rentalRate);
      await copyRequest.query(
        `INSERT INTO BookCopy (ISBN, CopyNo, DateIn, RentalRate, Status)
         VALUES (@isbn, 1, DATEADD(MINUTE, DATEDIFF(MINUTE, 0, GETDATE()), 0), @rentalRate, 'D')`
      );

      if (book.authorId) {
        const authorRequest = transaction.request();
        authorRequest.input('isbn', sql.Char(10), book.isbn);
        authorRequest.input('authorId', sql.SmallInt, book.authorId);
        await authorRequest.query(
          'INSERT INTO BookAuthor (ISBN, AuthorID) VALUES (@isbn, @authorId)'
        );
      }

      await transaction.commit();
    } catch (txErr) {
      await transaction.rollback();
      throw txErr;
    }
    return { ISBN: book.isbn, Title: book.title, CopyNo: 1, RentalRate: book.rentalRate, Status: 'D' };
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error('Error closing connection:', closeErr);
      }
    }
  }
}

// ORDER BY cannot take a bound parameter, so the column name is picked from a
// whitelist. The client only chooses a key. It never supplies SQL text.
const SORT_COLUMNS = { title: 'Title', year: 'YearPublish' };

// Optional filters: a WHERE clause (and its .input()) is added only when the
// client sent that key. An omitted filter must not filter anything.
async function list({ title, bookCat, sort, order, page, limit }) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();

    let where = 'WHERE 1 = 1';
    if (title) {
      where += ' AND Title LIKE @title';
      request.input('title', sql.VarChar(202), '%' + title + '%');
    }
    if (bookCat) {
      where += ' AND BookCat = @bookCat';
      request.input('bookCat', sql.Char(2), bookCat);
    }

    const sortColumn = SORT_COLUMNS[sort];
    const direction = order === 'desc' ? 'DESC' : 'ASC';
    request.input('offset', sql.Int, (page - 1) * limit);
    request.input('limit', sql.Int, limit);

    const result = await request.query(
      `SELECT ISBN, Title, YearPublish, PublisherID, BookCat
       FROM Book
       ${where}
       ORDER BY ${sortColumn} ${direction}
       OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`
    );
    return result.recordset;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error('Error closing connection:', closeErr);
      }
    }
  }
}

async function exists(isbn) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input('isbn', sql.Char(10), isbn);
    const result = await request.query('SELECT ISBN FROM Book WHERE ISBN = @isbn');
    return result.recordset.length > 0;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error('Error closing connection:', closeErr);
      }
    }
  }
}

module.exports = { getAuthorsByISBN, createBook, list, exists };
