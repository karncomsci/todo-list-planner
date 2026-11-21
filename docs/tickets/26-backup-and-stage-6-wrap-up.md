# 26: Backup export and import, stage 6 wrap-up

**What to build:** Settings gains backup: export all the Owner's data as one JSON file, and import a backup that replaces all data after a confirmation step, all or nothing (D33, D34, stories 58, 59). Stage 6, and the first release, ends with a hand-test checklist.

**Repositories:** `planner-api`, `planner-web`, root (`docs/api.md`, checklist).

**Blocked by:** 25 (Water Goal setting)

**Status:** not started

- [ ] `GET /api/backup` answers the backup as a JSON download (`Content-Disposition: attachment`): `format` "planner-backup", `version` 1, `exportedAt`, and the Owner's Categories, Tasks, Routine, every Daily Checklist and Settings; no password and no sessions (D33)
- [ ] `POST /api/backup` with a backup body replaces all of the Owner's Tasks, Categories, Routine, Daily Checklists and Settings in one transaction; IDs are assigned anew and Tasks keep their Categories through the backup's IDs; answers the counts imported
- [ ] A file in the wrong format (wrong `format` or `version`, a broken field, a Task naming a missing Category, a duplicate date or Category name) is 422 `invalid_backup` and changes nothing (D34)
- [ ] API tests: export then import into another Owner yields the same data; importing replaces rather than merges; a malformed file leaves data unchanged; the export holds no password hash or session (T2)
- [ ] `docs/api.md` and the web API types file are updated in this ticket
- [ ] A "สำรองข้อมูล" card: a download button, and a file picker whose import first asks for confirmation that all current data will be replaced; toasts on success and failure
- [ ] Every endpoint in `docs/api.md` matches the code
- [ ] A stage 6 hand-test checklist exists in `docs/` (T4)
- [ ] API tests and web checks pass
