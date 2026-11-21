# 16: Overdue Tasks on the Overview

**What to build:** The Overview lists every Overdue Task, however old, so nothing left behind slips out of sight.

**Repositories:** `planner-api`, `planner-web`, parent folder (`docs/api.md`).

**Blocked by:** 15 (Overview page with today's Tasks)

**Status:** done

- [x] `GET /api/overview` also answers `overdueTasks`: every Task of the Owner that is overdue under D23, with no date limit (D30, story 37)
- [x] Ordered by due date, oldest first, then by name
- [x] API tests: a Task due yesterday below 100 appears; a Task due today does not (A5); a done Task with a past due date does not; a Task dropping from 100 back below 100 with a past due date appears again; another Owner's Overdue Task is invisible (T2)
- [x] `docs/api.md` and the web API types file are updated in this ticket
- [x] The Overview shows "งานเลยกำหนด" with each Task's name and due date in BE, in the Overdue red, and a count in the heading; an empty list shows a short message
- [x] Ticking a Task done removes it from the list; clicking a Task opens the Task form, and moving its due date to today or later moves it to "งานวันนี้" when it covers today
- [x] Works at computer and phone widths (story 60)
- [x] API tests and web checks pass
