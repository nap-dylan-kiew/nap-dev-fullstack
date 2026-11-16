// An error-handling middleware has FOUR parameters. Express 5 sends it any error
// that is thrown, or any rejected promise from an async handler, that no route caught.
// Bad JSON in a request body arrives here too, carrying status 400.
function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  if (status === 500) {
    console.error(err);
  }
  res.status(status).json({
    error: status === 500 ? 'Internal server error' : 'Bad request',
  });
}

module.exports = errorHandler;
