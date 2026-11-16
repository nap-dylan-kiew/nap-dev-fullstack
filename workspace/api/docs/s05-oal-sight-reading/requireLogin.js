// Session 5 OAL, Exercise One. For reading, not running.
// Needs `jsonwebtoken` (jwt) and a JWT_SECRET in .env, which arrive in Session 6.
function requireLogin(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Login required' });
  }
  const token = header.slice(7);
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
