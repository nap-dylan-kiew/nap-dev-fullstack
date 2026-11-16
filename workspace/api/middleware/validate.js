// validate(schema) returns a middleware, so it can be mounted on any route:
//   app.post('/members', validate(memberSchema), memberController.register);
//   app.get('/books', validate(bookQuerySchema, 'query'), bookController.list);
//
// source is where the data lives: 'body', 'query' or 'params'.
// A bad request is answered here with a 400. A good one is handed on with next(),
// and the cleaned-up values (numbers converted, defaults filled in) are kept in
// req.validated[source]. Without next(), a valid request would hang forever.
function validate(schema, source = 'body') {
  return (req, res, next) => {
    // Without express.json(), req.body is undefined. Treat it as empty so the
    // schema reports the missing fields instead of passing silently.
    const data = req[source] || {};
    const { error, value } = schema.validate(data, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        error: error.details.map((detail) => detail.message).join('; '),
      });
    }
    req.validated = { ...req.validated, [source]: value };
    next();
  };
}

module.exports = validate;
