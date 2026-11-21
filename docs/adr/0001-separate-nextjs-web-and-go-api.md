---
status: accepted, amended by ADR 0002
---

# Separate Next.js web project and Go API project

The planner is a single-user app, yet it is built as two separate projects (originally two separate git repositories; since ADR 0002 two folders of one repository): a Next.js web front end and a Go REST API, with PostgreSQL behind the API. The Owner is fluent in Next.js, wants the back end as a standalone Go API, and reviews all code personally, so each side stays in a language and shape the Owner can read and maintain. We accept that every feature touches two projects and that the data shapes must be kept in step by hand.

## Considered Options

- **Next.js only, with its own API routes talking to PostgreSQL.** About half the moving parts for the same features. Rejected because the Owner wants the API in Go and independent of the web project.
- **Google Apps Script with a Google Sheet**, as in the reference product. Free and needs no hosting. Rejected because the Owner wants their own stack, code and database.

## Consequences

- The contract between the two projects is not machine-checked. There is no OpenAPI specification: the web project keeps hand-written API types in one place, and the API is described in one Markdown file in the parent folder. A change to an API shape must be made on both sides in the same piece of work.
- The browser sees one origin. The web project forwards API requests to Go, so there is no cross-origin configuration and the session cookie stays httpOnly.
- Docker Compose in the parent folder is the only supported way to run the whole system.
