# 05: All Task fields

**What to build:** The Task form offers every field: start date, start time and end time, Priority, Progress, and note. Status follows Progress automatically and the completed-at time is kept in step, so the Owner never maintains two values that can disagree.

**Repositories:** `planner-api`, `planner-web`, parent folder (API doc).

**Blocked by:** 04 (Quick add a Task)

**Status:** done

- [x] The form accepts start date (BE), start time, end time, Priority (high, medium, low), Progress (0 to 100) and note (stories 8 to 14, D20, A1)
- [x] A start date after the due date is rejected with a validation error naming the field (D20, story 18)
- [x] Invalid Priority, Progress outside 0 to 100, and an end time without a start time (or before it) are rejected with the field named
- [x] Responses include Status derived from Progress: 0 not started, 1 to 99 in progress, 100 done; Status is never stored (D21)
- [x] Completed-at is set when a Task is saved with Progress 100 (D22)
- [x] Responses include whether the Task is Overdue, computed on read in the Thailand time zone; a Task due today is not Overdue until the next day begins (D23, A5)
- [x] The form shows the derived Status next to Progress
- [x] API tests cover the Status rule, completed-at on create, Overdue including the due-today edge case, and the start-date-after-due-date rule (T2)
- [x] `docs/api.md` and the web API types file describe every Task field
