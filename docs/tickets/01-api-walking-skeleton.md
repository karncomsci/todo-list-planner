# 01: API walking skeleton

**What to build:** The Go API starts under Docker Compose next to PostgreSQL, applies its migrations on start, answers a health check, and returns every error in the single JSON error shape. A test harness drives the real HTTP app against a real database, becoming the pattern every later API test follows (T1, T5).

**Repositories:** `planner-api`, parent folder (Compose, env example, API doc).

**Blocked by:** None (can start immediately)

**Status:** done

- [x] `docker compose up` in the parent folder starts PostgreSQL and the API; the API waits for the database and applies pending migrations on start (D2, D3, D12)
- [x] Configuration (database URL, port, initial Owner email and password placeholders for ticket 03) comes from environment variables, documented in the parent `.env.example`
- [x] A health endpoint reports that the API is up and the database is reachable
- [x] Unknown routes and unexpected failures return the D15 error shape with an error code and message
- [x] Nothing needs a global install: goose runs as a library inside the API; sqlc runs from a pinned Docker image from ticket 03, because its PostgreSQL parser does not build natively on Windows
- [x] The test suite runs against a real PostgreSQL database, isolates data between tests, and has at least one HTTP-level test of the health endpoint and the error shape
- [x] `docs/api.md` exists with the conventions (base path, error shape, date format in CE) and the health endpoint
- [x] `planner-api/CLAUDE.md` gains the exact commands for running, testing, generating sqlc code and creating migrations
