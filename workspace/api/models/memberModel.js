const sql = require('mssql');
const dbConfig = require('../dbConfig');

// MemberID is not IDENTITY, so the next number is worked out inside the INSERT.
// DateJoin is set to the current minute, rounded DOWN: the smalldatetime default
// can round up past GETDATE() and fail CHECK (DateJoin <= GETDATE()).
// (Fine for a classroom. Two requests at the same instant could pick the same number.)
async function create(member) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input('name', sql.VarChar(50), member.name);
    request.input('address', sql.VarChar(150), member.address || null);
    request.input('contactNo', sql.Char(10), member.contactNo || null);
    request.input('emailAddr', sql.VarChar(50), member.emailAddr);
    request.input('gender', sql.Char(1), member.gender || null);
    request.input('branchNo', sql.TinyInt, member.branchNo);
    const result = await request.query(
      `INSERT INTO Member (MemberID, Name, Address, ContactNo, EmailAddr, Gender, DateJoin, BranchNo)
       OUTPUT INSERTED.MemberID, INSERTED.Name, INSERTED.EmailAddr, INSERTED.BranchNo
       SELECT ISNULL(MAX(MemberID), 0) + 1, @name, @address, @contactNo, @emailAddr, @gender,
              DATEADD(MINUTE, DATEDIFF(MINUTE, 0, GETDATE()), 0), @branchNo
       FROM Member`
    );
    return result.recordset[0];
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

async function exists(memberId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input('memberId', sql.SmallInt, memberId);
    const result = await request.query('SELECT MemberID FROM Member WHERE MemberID = @memberId');
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

module.exports = { create, exists };
