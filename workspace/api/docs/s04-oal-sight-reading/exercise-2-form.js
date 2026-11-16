// Session 4 OAL, Exercise Two. For reading, not running.
// This route is called from an HTML sign-up form.
app.post('/members', async (req, res) => {
  const { name, emailAddr } = req.body;
  // ... INSERT INTO Member (MemberID, Name, EmailAddr, BranchNo) VALUES (..., @name, @emailAddr, 1)
  res.status(201).json({ Name: name, EmailAddr: emailAddr });
});
