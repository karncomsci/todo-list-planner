# 25: Water Goal setting

**What to build:** Settings gains the Water Goal in glasses per day, which the Daily Checklist and Reports use (D28, story 57).

**Repositories:** `planner-api`, `planner-web`, root (`docs/api.md`).

**Blocked by:** 24 (Rename and delete Categories)

**Status:** not started

- [ ] `PUT /api/settings` with `waterGoal` 1 to 30 (`out_of_range` otherwise); answers the saved settings
- [ ] API tests: save and read back, range limits, Owner scoping (T2)
- [ ] `docs/api.md` and the web API types file are updated in this ticket
- [ ] A "เป้าดื่มน้ำ" card with a number field and save; the Daily Checklist then shows that many glasses
- [ ] API tests and web checks pass
