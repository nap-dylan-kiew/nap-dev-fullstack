// Middleware has the shape (req, res, next).
// This one writes a line for every request, then hands the request on.
function logger(req, res, next) {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
}

module.exports = logger;
