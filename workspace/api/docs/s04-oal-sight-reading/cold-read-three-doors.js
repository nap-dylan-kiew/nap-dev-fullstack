// Session 4 OAL, cold-read. For reading, not running.
// Request: PATCH /members/12?reason=address-change
// Body (JSON): { "address": "3 Orchard Road, Singapore 238841" }
app.patch('/members/:memberId', async (req, res) => {
  const { memberId } = req.params;
  const { reason } = req.query;
  const { address } = req.body;
  // ... UPDATE Member SET Address = @address WHERE MemberID = @memberId
  res.status(200).json({ MemberID: memberId, Address: address, Reason: reason });
});
