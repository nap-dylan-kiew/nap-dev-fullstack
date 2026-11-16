// Session 4 OAL, Exercise Two. For reading, not running.
// This route is called with a JSON body, for example from Postman.
app.post('/members', async (req, res) => {
  const { name, emailAddr } = req.body;
  // ... INSERT INTO Member (MemberID, Name, EmailAddr, BranchNo) VALUES (..., @name, @emailAddr, 1)
  res.status(201).json({ Name: name, EmailAddr: emailAddr });
});
