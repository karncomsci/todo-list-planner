# Stage 6 hand-test checklist

The Owner's whole-system test after stage 6, the last stage of the first release, on the real machine (T4). Tick each line; anything that fails becomes a ticket.

Stage 6 adds Settings (ตั้งค่า): Categories, the Water Goal, password change and backup.

## Before you start

- [ ] `docker compose up -d --build` in the root folder finishes, and `docker compose ps` shows `db`, `api` and `web` running
- [ ] There are a few Tasks, two Categories with Tasks in them, a Routine and some Daily Checklists

## Computer (http://localhost:3000 → ตั้งค่า)

### Categories (stories 55, 56)

- [ ] หมวดหมู่ lists every Category by name
- [ ] The pencil renames in place; a name already used shows "มีชื่อหมวดหมู่นี้อยู่แล้ว"; Esc or ยกเลิก leaves it unchanged
- [ ] The renamed Category shows on its Tasks (Task form, Calendar)
- [ ] The bin asks for confirmation; after ลบหมวดหมู่ its Tasks are still there with no Category
- [ ] เพิ่มหมวดหมู่ adds one, and it can be chosen in the Task form

### Water Goal (story 57)

- [ ] เป้าดื่มน้ำ shows 8 at first; 0 or 31 shows a message; 10 saves with a toast
- [ ] ตารางชีวิต then shows ten glasses; รายงาน names "เป้า 10 แก้ว"

### Password (story 54)

- [ ] Different new passwords show "รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน"; a wrong current password shows a message under that field; a new password under 8 characters shows a message
- [ ] A correct change shows a toast; this browser stays signed in
- [ ] Another browser or the phone that was signed in is sent to sign-in on its next action
- [ ] Signing out and in again works with the new password, not the old one

### Backup (stories 58, 59)

- [ ] ดาวน์โหลดไฟล์สำรอง downloads `planner-backup-<date>.json`; opening it shows Tasks, Categories, the Routine, checklists and settings, with no password or email
- [ ] After adding a Task, นำเข้าจากไฟล์… with that file asks for confirmation naming the file; ยกเลิก changes nothing
- [ ] แทนที่ข้อมูลทั้งหมด shows what was imported; the Task added after the download is gone and everything else is as in the file
- [ ] Importing a file that is not a backup (any other .json) shows "ไฟล์สำรองข้อมูลไม่ถูกต้อง ข้อมูลเดิมไม่ถูกเปลี่ยน", and nothing changed
- [ ] Keep one backup file somewhere off this machine

## Phone (narrower than 768 px)

- [ ] เพิ่มเติม → ตั้งค่า opens Settings and the More menu closes
- [ ] Cards stack in one column (D10); nothing runs off the right edge

## The whole first release

- [ ] Run the stage 1 to 5 checklists once more on computer and phone, to confirm nothing broke
- [ ] `docker compose down` then `docker compose up -d` keeps every piece of data
