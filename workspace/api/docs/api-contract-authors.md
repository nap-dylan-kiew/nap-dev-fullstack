# API contract: Author routes

A contract is the agreement between the frontend app and the backend app: what it asks for, and what it gets back. This is the worked example for the Author routes. Students fill in the same table for their Publisher routes.

| Method and path | What it does | Where the input comes from | Success | Other outcomes |
|---|---|---|---|---|
| `GET /authors` | Return every author | Nothing | `200` and an array of `{ AuthorID, Name }` | `500` if the database fails |
| `GET /authors/:id` | Return one author | `id` in the URL | `200` and `{ AuthorID, Name }` | `400` if `id` is not a number; `404` if no such author; `500` |
| `POST /authors` | Add an author | `id` and `name` in the JSON body | `201` and the stored `{ AuthorID, Name }` | `500` for a duplicate id (known limit) |
| `PUT /authors/:id` | Change an author's name | `id` in the URL, `name` in the JSON body | `200` and `{ AuthorID, Name }` | `400` if `id` is not a number; `404` if no such author; `500` |
| `DELETE /authors/:id` | Remove an author | `id` in the URL | `204` with no body | `400` if `id` is not a number; `404` if no such author; `500` (for example, the author is still in `BookAuthor`) |

Every error body has the same shape: `{ "error": "message" }`.
