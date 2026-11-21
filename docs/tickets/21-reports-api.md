# 21: Reports API

**What to build:** The API calculates the six Reports metrics for any date range (D31, D32), tested against a data set with known answers (T2).

**Repositories:** `planner-api`, root (`docs/api.md`).

**Blocked by:** 20 (Daily Checklist and stage 4 wrap-up)

**Status:** done

- [x] `GET /api/reports?from=YYYY-MM-DD&to=YYYY-MM-DD` (CE, both inclusive, at most 400 days; the same validation codes as listing Tasks by range)
- [x] `completedPerWeek`: for every Monday-start week touching the range, the number of Tasks whose completed-at time, in Thailand, falls in that week and in the range (story 49, D22)
- [x] `onTime`: over Tasks whose due date is in the range (A6) and that are settled (done, or due before today): `onTime` done on or before the due date in Thailand, `late` done after it, `notDone` overdue and not done, and `share` = onTime / settled, null when nothing is settled (story 50)
- [x] `byCategory` and `byPriority`: counts of Tasks due in the range; every Priority present, uncategorised last as category null (story 51)
- [x] `overdue`: Tasks due in the range that are overdue now (story 52, D23)
- [x] `water`: average glasses per day over the days of the range up to today, days without a record counting as 0, with the number of days counted; average null when the whole range is in the future (story 53, D27)
- [x] `allMealsDays`: days in the range with all three meals ticked (story 53)
- [x] API tests for every metric against one known data set, week edges in Thailand time, a range in the future, validation, and Owner scoping (T1, T2)
- [x] `docs/api.md` and the web API types file are updated in this ticket
- [x] API tests pass
