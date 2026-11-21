# 06: Category in the Task form

**What to build:** The Owner puts a Task in a Category or in none, choosing from their own Categories in the Task form, and can create a new Category right there without leaving the form. Renaming and deleting Categories stay in stage 6 (spec version 7).

**Repositories:** `planner-api`, `planner-web`, parent folder (API doc).

**Blocked by:** 05 (All Task fields)

**Status:** done

- [x] Category resource: list and create (D14, subset for stage 1)
- [x] Category names are unique per Owner; a duplicate returns a validation error naming the field (D24)
- [x] A Task can be saved with one Category or none (D24, story 11); a Category of another Owner is rejected
- [x] The Category select in the Task form has a "create new Category" action; the new Category is selected after creation
- [x] Task responses carry enough Category data to show its name
- [x] API tests cover: list and create, the uniqueness rule, Task with and without Category, another Owner's Categories are invisible and unusable (T2, D19)
- [x] `docs/api.md` and the web API types file describe the Category list and create actions
