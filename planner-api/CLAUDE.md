# planner-api

Go REST API for the Task Calendar Planner. Read the parent `../CLAUDE.md` first; its working rules apply here.

## Stack (D12)

Go 1.27, Fiber v3, pgx v5, goose v3 (as a library), sqlc.

- **Migrations** live in `internal/database/migrations`, are embedded in the binary and applied on start. Create one by adding the next numbered `.sql` file; that folder's README has the rules. There is no goose CLI.
- **sqlc** cannot parse PostgreSQL in a native Windows build, so it runs from its pinned Docker image (command below). Write SQL in `internal/database/queries`; the generated `*.gen.go` files are committed and never edited by hand.

## Layout

- `main.go`: reads the environment (`DATABASE_URL`, `PORT`, `OWNER_EMAIL`, `OWNER_PASSWORD`, `COOKIE_SECURE`), connects, migrates, seeds the Owner, serves.
- `internal/database`: connection pool, migrations, and the sqlc-generated `Queries`.
- `internal/auth`: password hashing, session tokens, and seeding the Owner.
- `internal/httpapi`: routes, handlers, and the error shape. Handlers return `*httpapi.Error` for expected failures (use `validation(field, code, message)` for a broken field rule); anything else becomes a logged 500.

## Routes and the session

Routes registered on the `owned` group in `app.go` pass `requireOwner`; read the Owner with `currentOwnerOf(c)` and pass its ID into every query. Public routes are registered above that group, and there are only three: health, sign-in, sign-out.

## Conventions

- **Dates are CE** (D9). The API's "today" is the date in Asia/Bangkok.
- **Every query is scoped by Owner ID** (D19). An Owner ID is taken only from the session, never from the request body or path.
- **One error shape** (D15), documented in `../docs/api.md`. Add each new error code there.
- **Derived values are computed on read**: Status (D21) and Overdue (D23) appear in responses and are never stored.

## Commands

Run from this folder unless noted. The database must be up first: `docker compose up -d db` in the parent folder.

- Test: `TEST_DATABASE_URL="postgres://<user>:<password>@localhost:5433/postgres?sslmode=disable" go test ./...`, with user and password from the parent `.env`
- Vet and build: `go vet ./... && go build ./...`
- Generate sqlc code (Git Bash): `MSYS_NO_PATHCONV=1 docker run --rm -v "$(pwd -W):/src" -w /src sqlc/sqlc:1.31.1 generate`
- New migration: add `internal/database/migrations/NNNNN_description.sql` with the next number
- Run in Docker: `docker compose up -d --build api` in the parent folder, then `curl http://127.0.0.1:8080/api/health`

## Tests (T1, T2)

Tests drive the real Fiber app with HTTP requests against a real PostgreSQL database: send a request, assert on the response and on what later requests see. Mocking the database or asserting on internal functions is out of pattern. The harness in `internal/httpapi/harness_test.go` gives each test its own freshly migrated database, so tests are independent; extend it rather than writing a second one.
