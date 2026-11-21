# 07: Edit and delete a Task

**What to build:** The Owner opens a saved Task from the recent-Tasks list, edits every field, and saves. The Owner can delete a Task after a confirmation step; deletion is permanent.

**Repositories:** `planner-api`, `planner-web`, parent folder (API doc).

**Blocked by:** 05 (All Task fields)

**Status:** done

- [x] Task resource: get one, update, delete (D14)
- [x] Every field can be changed, including clearing optional ones (story 15)
- [x] Update applies the same validation as create
- [x] Completed-at is set when Progress reaches 100 and cleared when Progress drops below 100 (D22)
- [x] Delete asks for confirmation in the UI and removes the Task permanently (D25, story 16)
- [x] Getting, updating or deleting another Owner's Task behaves as not found (D19)
- [x] API tests cover: update of every field, completed-at set and cleared on update, delete then get returns not found, cross-Owner access is refused (T2)
- [x] `docs/api.md` and the web API types file describe get, update and delete
