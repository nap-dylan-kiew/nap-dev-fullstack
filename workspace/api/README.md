# bookcat-api

A Node.js and Express backend app, built up one session at a time for **BED OCT26** (Backend Development, Ngee Ann Polytechnic).

This repository is a **reference for the teaching team and for students**. The code you see here is exactly what was built in class, up to the most recent session taught.

## How the repo is organised

There is one branch, `main`, and each session ends at a **tag**. A tag is a labelled snapshot of the whole project at that moment.

Each session has an IPL (the 3-hour class) and an OAL (the 1-hour online work before the next class).

| Tag | What the code looks like |
|---|---|
| `s01-oal-end` | Node, npm and Express running. `GET /` and `GET /categories` (a hardcoded array). This is also the starting point for Session 2. |
| `s02-ipl-end` | The live-coded routes against the NP Bookstore `Author` table: `GET /authors`, `GET /authors/:id`, `POST`, `PUT` and `DELETE`, each with `try / catch / finally`, `parseInt`, bound inputs and the right status code. |
| `s02-oal-end` | Settings move into a `.env` file (`dotenv`, `.env.example`, `.env` in `.gitignore`). Adds `docs/api-contract-authors.md`, a worked API contract table. This is also the starting point for Session 3. |
| `s03-ipl-end` | Book, BookCopy and BookAuthor routes in `app.js`: `GET /books/:isbn`, `POST /books` (two INSERTs in one transaction), `PUT /books/:isbn`, the JOIN route `GET /authors/:id/books`, and the composite-key routes `GET` and `DELETE /books/:isbn/copies/:copyNo`. |
| `s03-oal-end` | The MVC split. `models/` holds the SQL, `controllers/` holds the logic, `app.js` only points routes at controller functions. Adds `PUT /books/:isbn/copies/:copyNo` (with a Joi check on `rentalRate`) and `GET /books/:isbn/authors`. Adds the `joi` dependency. This is also the starting point for Session 4. |
| `s04-ipl-end` | Orchestration. `POST /copies/rent` calls `checkAvailable()` then `markRented()` (404 / 409 / 200), one Joi schema checks `isbn` and `copyNo` together, `deleteCopy` is wrapped in `try / catch`, and `POST /books` moves into a Controller and Model with its transaction. |
| `s04-oal-end` | Adds `docs/s04-oal-sight-reading/`, the routes you read in the OAL. They are for reading only and nothing loads them. The app is unchanged from `s04-ipl-end`. This is also the starting point for Session 5. |
| `s05-ipl-end` | Middleware. `middleware/logger.js` and `middleware/validate.js` (`validate(schema)` returns a middleware), `express.urlencoded()`, `schemas/` for the Joi rules. New routes: `POST /members`, `GET /books` (optional filters, paging with `OFFSET / FETCH`, sort whitelist) and `POST /books/:isbn/copies` (404 / 409 / 400). |
| `s05-oal-end` | Adds `docs/s05-oal-sight-reading/`: `requireLogin`, `requireRole` and the route-order example, for reading only. The app is unchanged from `s05-ipl-end`. This is also the starting point for Session 6. |
| `s06-lab-end` | **Reference solution for the Session 6 lab**, the Counter Desk prototype. `POST /books` adds a book and its first copy in one transaction. `POST /copies/rent` and `POST /copies/return` each write the `Loan` and `BookCopy` tables in one transaction (`LoanNo` is `IDENTITY`, so `OUTPUT INSERTED.LoanNo` gets it back). Stretch: `PATCH` a copy's rate, `GET /books/:isbn/availability`, and an error-handling middleware. Released after the lab session. |

More tags are added here as each session is taught.

## Run it

You need Node.js installed.

```bash
git clone <this repo's URL>
cd bookcat-api
npm install
npm start
```

From Session 2 onward the routes need the **NP Bookstore** database on your own SQL Server.

- Until `s02-oal-end`, put your own login in `dbConfig.js`.
- From `s02-oal-end` onward, copy `.env.example` to `.env` and put your login there. `.env` is ignored by git. Never commit a real password.

Then open <http://localhost:3000/> in a browser. The files in `requests/` list the requests for each session.

## Look at a session, or live-code it

You do not need to be a collaborator, and you cannot push to this repo. Clone it and work on your own copy.

```bash
# See the code exactly as it was at the end of a session (read-only view)
git checkout s01-oal-end

# Start a session live, from where the previous one ended
git switch -c my-demo s01-oal-end

# See what changed between two points
git diff s01-oal-end s02-ipl-end

# Return to the latest code
git switch main
```

You can also download any tag as a zip from the repository's **Releases** or **Tags** page on GitHub.

## Conventions

- The database is **NP Bookstore** (SQL Server).
- CommonJS (`require`), not ES modules.
- Every response uses `res.status(code).json({ ... })`. The only exception is DELETE, which sends `res.status(204).send()`.
- Ids and numeric query values are converted with `parseInt`.
