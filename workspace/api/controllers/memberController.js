const memberModel = require('../models/memberModel');

// By the time this runs, validate(memberSchema) has already checked req.body.
async function register(req, res) {
  try {
    const member = await memberModel.create(req.validated.body);
    res.status(201).json(member);
  } catch (err) {
    // 547 = foreign key violation: the branchNo is not a real branch.
    if (err.number === 547) {
      return res.status(400).json({ error: 'Unknown branchNo' });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { register };
