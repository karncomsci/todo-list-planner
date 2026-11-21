# 04: Quick add a Task

**What to build:** On the Task entry page the Owner adds a Task with only a name and a due date, entered in BE. A wrong or missing field is named in the error. The Task just saved appears in a list of recent Tasks beside the form, and a toast confirms the save.

**Repositories:** `planner-api`, `planner-web`, parent folder (API doc).

**Blocked by:** 03 (Sign-in end to end)

**Status:** done

- [x] Task storage exists with every D20 field, each Task belonging to an Owner (D19); fields beyond name and due date may stay unused until ticket 05. Category is the exception: its column arrives with the categories table in ticket 06
- [x] Task resource: create, and list (D14). List supports the recent-Tasks case (most recently changed first, with a limit) as an option of the List action
- [x] Missing name and missing due date each return a validation error naming the field (D15, story 18)
- [x] The date field is a calendar the Owner picks from, with Thai months and BE years, weeks from Monday; the API receives CE (D9, story 19). Owner asked for a picker instead of typing on 21 Nov 2026
- [x] BE conversion and formatting are pure functions with unit tests, including year boundaries and leap years (T3)
- [x] The recent-Tasks list beside the form shows the new Task right after saving (story 17)
- [x] Save success and failure show a toast (story 64)
- [x] API tests cover: create succeeds, validation errors for missing name and missing due date, and one Owner cannot list or read another Owner's Tasks (T2, D19)
- [x] `docs/api.md` and the web API types file describe the Task create and list actions
