# 19: Routine on the Life Schedule page

**What to build:** A Life Schedule page where the Owner types one Routine entry for each hour from 05:00 to 23:00, saves it as the one template used every day, and can clear it in one step (D26, stories 40 to 42).

**Repositories:** `planner-api`, `planner-web`, root (`docs/api.md`).

**Blocked by:** 18 (Overview charts and stage 3 wrap-up)

**Status:** done

- [x] Migration: a `routine_entries` table, one row per Owner and hour (5 to 23), text up to 200 characters; empty entries are not stored (D26, D19)
- [x] `GET /api/routine` answers `{ "entries": [{ "hour": 5, "text": "" }, …] }` with all nineteen hours, empty text for hours with no entry
- [x] `PUT /api/routine` replaces the whole template with the hours given; text is trimmed; an hour outside 5 to 23 or given twice is `out_of_range` on `entries`, text over 200 characters is `too_long` on `entries`
- [x] `DELETE /api/routine` clears every entry (story 42); 204
- [x] API tests: a new Owner gets nineteen empty hours; save then read back; save replaces (an hour left out becomes empty); clear; validation; another Owner's Routine is invisible (T1, T2)
- [x] `docs/api.md` and the web API types file are updated in this ticket
- [x] `/life` shows "กิจวัตร" with one text field per hour labelled 05:00 to 23:00, a save button and a clear button that asks for confirmation; toasts on save and failure (story 64)
- [x] The Life Schedule menu entry is enabled; the page works at computer and phone widths
- [x] API tests and web checks pass
