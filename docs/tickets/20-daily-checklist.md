# 20: Daily Checklist and stage 4 wrap-up

**What to build:** Beside the Routine, the Life Schedule page gains the Daily Checklist: glasses of water against the Water Goal, three meals each with a menu and a tick, and the Reminder Note. Each day starts fresh and past days are kept and can be looked at (D27, D28, stories 43 to 47). Stage 4 ends with a hand-test checklist.

**Repositories:** `planner-api`, `planner-web`, root (`docs/api.md`, checklist).

**Blocked by:** 19 (Routine on the Life Schedule page)

**Status:** done

- [x] Migrations: a `daily_checklists` table, one row per Owner and date (glasses 0 to 30, three meal menus up to 100 characters each, three meal ticks, Reminder Note up to 1000 characters); an `owner_settings` table holding the Water Goal, default 8 (A4)
- [x] `GET /api/checklists/{date}` answers the checklist for that CE date; a day with no record answers an empty checklist (D27)
- [x] `PUT /api/checklists/{date}` saves the whole checklist for that date, creating or replacing it; validation names the failing field
- [x] `GET /api/settings` answers `{ "settings": { "waterGoal": 8 } }`, the default when never saved (D28); saving arrives in ticket 25
- [x] API tests: an unsaved day is empty; days are separate (saving one leaves the next empty); replace; validation; another Owner's checklist is invisible; the Water Goal defaults to 8 (T2)
- [x] `docs/api.md` and the web API types file are updated in this ticket
- [x] The page shows "เช็กลิสต์ประจำวัน" with the date in BE: one glass per glass of the Water Goal (pressing glass N sets the count to N; pressing the last filled glass again lowers it by one), เช้า / กลางวัน / เย็น each with a menu field and a tick, and "โน้ตเตือนใจ"
- [x] Ticks and glasses save at once; text fields save when the field is left; failures show a toast (story 64)
- [x] Previous and next day buttons show other days' checklists, and "วันนี้" returns to today (story 47); the page opens on today, so a new day starts empty (story 46)
- [x] On computers the Routine and the checklist sit side by side; on phones they stack (story 60)
- [x] A stage 4 hand-test checklist exists in `docs/` (T4)
- [x] API tests and web checks pass
