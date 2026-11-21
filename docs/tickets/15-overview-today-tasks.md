# 15: Overview page with today's Tasks

**What to build:** The Overview becomes the first page after sign-in and lists today's Tasks, so the Owner sees what to do first. The API gains the Overview resource, which later tickets extend. Every number and list on the Overview comes from the API (D32).

**Repositories:** `planner-api`, `planner-web`, parent folder (`docs/api.md`).

**Blocked by:** 14 (Year View and stage 2 wrap-up)

**Status:** done

- [x] `GET /api/overview` answers `{ "today": "YYYY-MM-DD", "todayTasks": [Task, …] }` for the signed-in Owner only (D14, D19)
- [x] Today's Tasks are those whose span covers today in Thailand: from the start date, or the due date when there is none, to the due date. Done Tasks stay in the list (D30, story 36)
- [x] Order matches listing by date range: Tasks without a time first, then timed Tasks by start time
- [x] API tests at the HTTP boundary: a Task due today, a multi-day Task covering today, a Task starting tomorrow and a Task due yesterday (only the first two appear), a done Task due today, another Owner's Task is invisible, and no session answers 401 (T1, T2)
- [x] `docs/api.md` documents the endpoint, and the web API types file matches it
- [x] `/overview` shows "งานวันนี้" with each Task's name, time, Priority colour and Status; done Tasks are struck through as on the Calendar; an empty day shows a short empty message
- [x] The tick control sets a Task done and clicking a Task opens the Task form over the page, as on the Calendar; the list updates after save, delete or tick
- [x] Signing in and opening `/` land on the Overview; the Overview entry in the left and bottom menus is enabled (D10, story 36)
- [x] Works at computer and phone widths (story 60)
- [x] API tests and web checks pass: typecheck, lint, unit tests, production build
