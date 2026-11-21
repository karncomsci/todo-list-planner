# 18: Overview charts and stage 3 wrap-up

**What to build:** The Overview gains two charts for the current month, Tasks by Status and Tasks by Category, so the Owner reads the month at a glance. Stage 3 ends with a hand-test checklist (D35, T4).

**Repositories:** `planner-api`, `planner-web`, parent folder (`docs/api.md`, checklist).

**Blocked by:** 17 (This month's summary on the Overview)

**Status:** done

- [x] `GET /api/overview` also answers, for the same set of Tasks as the month summary, counts by Status (`not_started`, `in_progress`, `done`, each present even at 0) and counts by Category (each Category with at least one Task in the set, plus one entry for uncategorised Tasks when there are any) (D30, D32, story 39)
- [x] API tests: the Status counts add up to `total`; Category counts match a known data set; Tasks of a Category whose Tasks are all due in other months do not appear; another Owner's Categories are invisible (T2)
- [x] `docs/api.md` and the web API types file are updated in this ticket
- [x] Recharts is added at a pinned version; the Status chart is a donut and the Category chart a bar chart, with Thai labels (ยังไม่เริ่ม, กำลังทำ, เสร็จแล้ว, ไม่มีหมวดหมู่) (D5)
- [x] Chart colours come from the theme's CSS variables and follow light and dark themes (D8, story 61)
- [x] Chart animation is shorter than 0.3 seconds and off when the device asks for reduced motion (D7, story 63)
- [x] A month with no Tasks shows a short message instead of empty charts
- [x] Works at computer and phone widths (story 60)
- [x] Every endpoint in `docs/api.md` matches the code
- [x] A stage 3 hand-test checklist for computer and phone exists in the parent `docs/` folder (T4)
- [x] API tests and web checks pass
