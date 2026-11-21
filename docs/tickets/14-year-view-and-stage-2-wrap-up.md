# 14: Year View and stage 2 wrap-up

**What to build:** On a computer, the View switcher gains a year View showing the twelve months with their Tasks, so the Owner sees which parts of the year are busy. Stage 2 ends with a hand-test checklist so the Owner can test the new Views on the real machine (D35, T4).

**Repositories:** `planner-web`, parent folder (checklist).

**Blocked by:** 12 (View switcher and week View)

**Status:** done

- [x] The switcher offers day, week, month and year; the year View uses the FullCalendar standard multi-month plugin at the same version as the other FullCalendar packages (D6, story 22)
- [x] Each month in the year View starts its weeks on Monday and shows its title with a BE year; the page title shows the BE year (D9, story 33)
- [x] Tasks show with Priority colour, red Overdue and struck-through done, and open the Task form when clicked (stories 27 to 30)
- [x] Previous, next and today move by one year; the fetched range stays within the API's range limit (story 23)
- [x] Clicking a day does not change the View (not in the spec)
- [x] A stage 2 hand-test checklist for the computer Views exists in the parent `docs/` folder, and notes that the phone Calendar is unchanged (T4, D10)
- [x] Web checks pass: typecheck, lint, unit tests, production build
