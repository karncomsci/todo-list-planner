# Task Calendar Planner (ปฏิทินตารางงาน)

A personal, single-Owner task planner: a Next.js web front end and a Go REST API on PostgreSQL, run together with Docker Compose.

## Sources of truth

- `docs/specs/0001-planner-v1.md`: the approved spec. Every decision has an ID (D2–D37, T1–T5, A1–A7; D1 is retired); cite the ID when code follows from it. `0001-planner-v1.th.md` is an old Thai copy kept for reference only.
- `GLOSSARY.md`: domain terms, in Thai. Code and docs use the English names from the spec's term table; the UI shows the Thai names.
- `docs/adr/`: architecture decisions.
- `docs/api.md`: the only contract between web and API (no OpenAPI, D13).
- `docs/tickets/`: work tickets, one Markdown file each, with blocking edges.

## Layout

One git repository (D37, ADR 0002), remote `origin` on GitHub. Branches: `main` holds tested releases, `develop` holds work in progress, and each piece of work gets its own `feature/<short-name>` branch from `develop` (see Working rules). The root holds the docs above plus `compose.yaml` and `.env.example`; `.env` holds real passwords and is never committed.

- `planner-api/`: Go API, a project of its own. See its `CLAUDE.md`.
- `planner-web/`: Next.js front end, a project of its own. See its `CLAUDE.md`.

## Working rules

- **Branches.** Start each piece of work on a new `feature/<short-name>` branch made from an up-to-date `develop`. Commits and pushes go to that feature branch only. Never commit to or merge into `main`: the Owner tests and merges into `main` themselves.
- **The Owner commits.** Leave every change uncommitted. Work one ticket at a time, then stop and hand over for review with a summary of what changed and the test results.
- **Decisions are fixed.** Follow D2–D37 as written. When a ticket seems to need a different decision, stop and ask the Owner before writing code.
- **Spec edits** raise the document version and add a row to the change table at the end of the spec. A change to a term's meaning updates `GLOSSARY.md` in the same edit.
- **API shape changes are atomic**: update `docs/api.md`, the Go handler, and the web's API types file in the same ticket and the same commit.
- **A ticket is done** when every acceptance criterion holds, the test suites of each touched project pass, and `docs/api.md` matches the code.
