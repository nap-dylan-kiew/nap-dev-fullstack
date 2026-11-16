// Session 5 OAL, Exercise Two. For reading, not running.
function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Not allowed' });
    }
    next();
  };
}
