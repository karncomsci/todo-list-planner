# 08: Calendar month View

**What to build:** On a computer, the Calendar page shows the month's Tasks in a month View. Multi-day Tasks appear as bars, Tasks without a start date sit on their due date, Priority shows as colour, Overdue Tasks are red on their original due date, done Tasks are struck through, and today is clearly marked. The Owner moves between months and jumps back to today.

**Repositories:** `planner-api`, `planner-web`, parent folder (API doc).

**Blocked by:** 05 (All Task fields)

**Status:** done

- [x] Task list by date range returns every Task that overlaps the range, including multi-day Tasks that start before or end after it (D14)
- [x] The month View uses the FullCalendar standard bundle, weeks start on Monday, and month titles show BE years (D6, D9, story 33)
- [x] A Task with a start date is a bar from start date to due date; a Task without one appears only on its due date (stories 24, 25)
- [x] Priority sets the colour; Overdue Tasks are red and stay on their due date; done Tasks are struck through (stories 27 to 29, A3)
- [x] Today is clearly marked (story 32)
- [x] Previous, next and today controls move the View and fetch the matching range (story 23)
- [x] Turning Tasks into calendar events is a pure function with unit tests covering multi-day Tasks, Tasks without a start date, and Tasks without a time (T3)
- [x] The Calendar is the landing page after sign-in until Overview exists in stage 3
- [x] API tests cover listing by range, including multi-day Tasks crossing either edge of the range (T2)
- [x] `docs/api.md` describes the date-range parameters
