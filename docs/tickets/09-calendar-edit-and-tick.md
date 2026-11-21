# 09: Edit and tick done from the Calendar

**What to build:** The Owner clicks a Task on the month View to edit it without leaving the Calendar, and ticks a Task done directly on the Calendar. The View updates at once.

**Repositories:** `planner-web` (and `planner-api` only if a gap appears).

**Blocked by:** 07 (Edit and delete a Task), 08 (Calendar month View)

**Status:** done

- [x] Clicking a Task opens the Task form for that Task over the Calendar; saving or deleting updates the View (story 30)
- [x] Each Task on the Calendar has a tick control; ticking sets Progress to 100, after which the Task shows struck through and is no longer Overdue (story 31, D21)
- [x] Unticking a done Task is possible from the form by lowering Progress
- [x] Save success and failure show a toast (story 64)
