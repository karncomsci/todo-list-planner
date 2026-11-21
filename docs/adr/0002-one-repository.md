---
status: accepted
---

# One git repository for the web, the API and the documents

The web front end and the Go API stay two separate projects, as ADR 0001 decided, but they now live as two folders of one git repository, together with the glossary, spec, API document, tickets and Docker Compose files. Until stage 3 there were two repositories and a parent folder outside version control, so the documents had no history, and a change to an API shape, which must touch `docs/api.md`, the Go handler and the web's types together, could not land as one commit. The project has one Owner, one deployment through Docker Compose and no separate release cycles, so separate repositories bought nothing in return. This replaces D1 with D37.

## Considered Options

- **Keep two repositories and add a third for the documents.** Versions everything, but an API change still spans three commits in three places, and the Owner has three remotes to keep in step.
- **Keep two repositories and leave the documents unversioned.** The state before this decision; rejected because the spec and tickets are the project's sources of truth.

## Consequences

- The histories of the two former repositories are kept: each was added under its folder with `git subtree`, so `git log -- planner-api/` shows the API's commits from ticket 01.
- Each project keeps its own `CLAUDE.md`, `.gitignore`, tooling and test suite; nothing is shared between them except through `docs/api.md` (D13).
- The repository is on GitHub as `todo-list-planner`, branch `main`.
