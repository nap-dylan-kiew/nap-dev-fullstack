// Session 5 OAL. For reading, not running.

// "Order Matters, Again": express runs these left to right.
router.delete('/books/:isbn', requireLogin, requireRole('staff'), bookController.remove);

// Cold-read: a valid staff token is sent with DELETE /books/0446310786.
// What happens?
router.delete(
  '/books/:isbn',
  requireRole('staff'),
  requireLogin,
  bookController.remove
);
