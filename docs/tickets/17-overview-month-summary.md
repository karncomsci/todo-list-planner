# 17: This month's summary on the Overview

**What to build:** The Overview shows four numbers for the current month (all Tasks, completed, in progress, overdue), counting up when the page opens, so the Owner can judge the month's workload.

**Repositories:** `planner-api`, `planner-web`, parent folder (`docs/api.md`).

**Blocked by:** 15 (Overview page with today's Tasks)

**Status:** done

- [x] `GET /api/overview` also answers `month`: the month in Thailand (`YYYY-MM`, CE) and the counts `total`, `done`, `inProgress` and `overdue` (D30, D32, story 38)
- [x] The counts cover Tasks whose due date falls in the current month in Thailand. `done` is Progress 100, `inProgress` is Progress 1 to 99 (D21), and `overdue` counts the Tasks in that set that are overdue now (D23)
- [x] API tests with a test clock pinned to a known day: Tasks due on the month's first and last days count, Tasks due the day before and the day after do not, each count matches a known data set, and the month turns over at midnight Thailand time (T2)
- [x] `docs/api.md` and the web API types file are updated in this ticket
- [x] The Overview shows four cards labelled ทั้งหมด, เสร็จแล้ว, กำลังทำ and เลยกำหนด, under a heading naming the month with its BE year
- [x] The numbers count up with Motion in under 0.3 seconds and appear without animation when the device asks for reduced motion (D7, story 63)
- [x] Ticking or editing a Task on the Overview updates the numbers
- [x] Works at computer and phone widths (story 60)
- [x] API tests and web checks pass
