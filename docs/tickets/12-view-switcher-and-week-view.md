# 12: View switcher and week View

**What to build:** On a computer, the Calendar page gains a View switcher with week and month. The week View is divided by hour, starts on Monday, and its title shows the date range with BE years. Tasks without a time sit in the top row; timed Tasks sit at their hours. Colours, strike-through, Overdue and the today marker work as in the month View, and the Owner edits and ticks Tasks done from the week View as from the month View.

**Repositories:** `planner-web`. The API needs no change: listing by date range already covers a week.

**Blocked by:** 11 (Motion and stage 1 wrap-up)

**Status:** done

- [x] Prefactor first: the month Calendar becomes one Calendar component that takes the View, with the header (title, previous, today, next and their labels) following the current View
- [x] The switcher appears only at computer width; the phone keeps the compact calendar (D10)
- [x] The week View uses the FullCalendar standard time-grid plugin at the same version as the other FullCalendar packages, and weeks start on Monday (D6, D9, story 21, 33)
- [x] Tasks without a time are in the top all-day row; timed Tasks sit from their start time to their end time, including timed Tasks spanning several days (story 26, A1)
- [x] Priority colour, red Overdue Tasks on their due date, struck-through done Tasks and a clearly marked today match the month View (stories 27 to 29, 32)
- [x] Clicking a Task opens the Task form over the Calendar; the tick control sets Progress to 100; the View updates after save, delete or tick (stories 30, 31)
- [x] Previous, next and today move by one week and fetch the matching range (story 23)
- [x] The month View stays the default View on opening the Calendar; the chosen View is not remembered
- [x] Unit tests cover the week title in BE, including a week that crosses two months and one that crosses two years (T3)
- [x] Web checks pass: typecheck, lint, unit tests, production build
