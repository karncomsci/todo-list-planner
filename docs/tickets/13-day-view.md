# 13: Day View

**What to build:** On a computer, the View switcher gains a day View: one day divided by hour, with the same rules as the week View. Its title shows the full Thai date with a BE year.

**Repositories:** `planner-web`.

**Blocked by:** 12 (View switcher and week View)

**Status:** done

- [x] The switcher offers day, week and month; the day View uses the time-grid plugin (D6, story 21)
- [x] Tasks without a time are in the top row; timed Tasks sit at their hours; a multi-day Task covering the day appears on it (stories 24 to 26)
- [x] Colours, Overdue, strike-through, today marker, edit and tick behave as in the week View (stories 27 to 32)
- [x] Previous, next and today move by one day and fetch the matching range (story 23)
- [x] The title shows the full Thai date with a BE year (D9, story 19)
- [x] Web checks pass: typecheck, lint, unit tests, production build
