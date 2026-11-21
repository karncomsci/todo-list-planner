# 11: Motion and stage 1 wrap-up

**What to build:** Stage 1 pages gain the short animations from D7 and respect reduced motion. The API document is checked against the code, and the Owner receives a hand-test checklist for computer and phone, so real use can begin (D35).

**Repositories:** `planner-web`, parent folder (API doc, checklist).

**Blocked by:** 10 (Phone Calendar)

**Status:** done

- [x] Page transitions, the Task form sliding in and out, and ticking a Task done are animated with Motion, each shorter than 0.3 seconds (D7, story 62)
- [x] With reduced motion enabled on the device, those animations are off (D7, story 63)
- [x] The calendar grid has no added animation (D7)
- [x] Every endpoint in `docs/api.md` matches the code, and the web API types file matches `docs/api.md`
- [x] A stage 1 hand-test checklist for computer and phone exists in the parent `docs/` folder (T4)
- [x] From a clean machine state, `docker compose up` with a filled-in env file brings up a usable system (story 65)
