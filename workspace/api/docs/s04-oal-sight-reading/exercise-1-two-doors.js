// Session 4 OAL, Exercise One. For reading, not running.

// Route 1: where does isbn come from?
app.get('/books/:isbn', async (req, res) => {
  const isbn = req.params.isbn;
  // ... SELECT ... WHERE ISBN = @isbn
});

// Route 2: where does title come from?
app.get('/books/search', async (req, res) => {
  const title = req.query.title;
  // ... SELECT ... WHERE Title LIKE @title
});
