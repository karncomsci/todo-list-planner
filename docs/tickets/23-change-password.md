# 23: Settings page and password change

**What to build:** A Settings page, starting with changing the password after confirming the current one (story 54, D18).

**Repositories:** `planner-api`, `planner-web`, root (`docs/api.md`).

**Blocked by:** 22 (Reports page and stage 5 wrap-up)

**Status:** done

- [x] `PUT /api/password` with `currentPassword` and `newPassword`: 204 on success; `currentPassword` `required` or `incorrect`; `newPassword` `required`, `too_short` (under 8 characters, as for the initial password), `too_long` (over 72 bytes, the hashing limit)
- [x] After a change the new password signs in and the old one does not; every other session of the Owner is ended and the current one stays (D17)
- [x] API tests for success, wrong current password, too short, other sessions ended, current session kept (T1, T2)
- [x] `docs/api.md` and the web API types file are updated in this ticket
- [x] `/settings` shows a "เปลี่ยนรหัสผ่าน" card: current, new, and confirm new (checked in the browser), with Thai errors per field and a toast on success
- [x] Cards stack in one column on phones (D10); the Settings menu entry is enabled
- [x] API tests and web checks pass
