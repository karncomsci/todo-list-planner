# Stage 1 hand-test checklist

The Owner's whole-system test after stage 1, on the real machine, on a computer and on a phone (T4). Tick each line; anything that fails becomes a ticket.

Stage 1 covers sign-in, Task entry, the Calendar month View and the light and dark themes. Pages not yet built (ภาพรวม, ตารางชีวิต, รายงาน, ตั้งค่า) appear in the menus as disabled.

## Before you start

- [ ] `.env` exists in the parent folder, copied from `.env.example`, with `POSTGRES_PASSWORD`, `OWNER_EMAIL` and `OWNER_PASSWORD` filled in
- [ ] `docker compose up -d --build` in the parent folder finishes, and `docker compose ps` shows `db`, `api` and `web` running (story 65)
- [ ] For the phone: find this machine's address with `ipconfig` (IPv4 Address), and allow port 3000 through Windows Firewall if it asks. The phone must be on the same Wi-Fi

Test data: today's date matters, so use real dates around today.

## Computer (http://localhost:3000)

### Sign-in and session (stories 1 to 6)

- [ ] Opening any page while signed out leads to "เข้าสู่ระบบ"; after signing in you land on the page you asked for
- [ ] A wrong password says "อีเมลหรือรหัสผ่านไม่ถูกต้อง", without saying which one was wrong
- [ ] Signing in without "จดจำการเข้าสู่ระบบ": closing the whole browser and opening it again asks for sign-in
- [ ] Signing in with "จดจำการเข้าสู่ระบบในอุปกรณ์นี้ 30 วัน": closing and reopening the browser keeps you signed in
- [ ] The sign-out button (bottom left) signs you out at once and leads to "เข้าสู่ระบบ"; reloading any page asks for sign-in again
- [ ] Signed in, `http://localhost:3000` opens ตารางงาน (the Calendar)

### Task entry (ตารางงาน → บันทึกงาน, stories 7 to 19)

- [ ] A Task with only a name and a due date saves; a toast says "บันทึกงานแล้ว" and the Task tops "งานล่าสุด"
- [ ] Saving without a name, or without a due date, names that field in red and puts the cursor in it
- [ ] Dates are picked from a calendar, shown with BE years, and "วันนี้", "พรุ่งนี้", "อีก 7 วัน" pick at once
- [ ] A start date after the due date is refused with "วันเริ่มต้องไม่อยู่หลังวันครบกำหนด"
- [ ] Only one of start time and end time is refused; on a one-day Task an end time before the start time is refused
- [ ] Moving Progress shows its Status beside it: 0 ยังไม่เริ่ม, 1–99 กำลังทำ, 100 เสร็จแล้ว
- [ ] "+ หมวดหมู่ใหม่" creates a Category inside the form and selects it; the same name again says "มีชื่อหมวดหมู่นี้อยู่แล้ว"
- [ ] A Task saved in a Category shows the Category name in "งานล่าสุด"
- [ ] A Task due yesterday shows "เลยกำหนด" in red; one due today does not

### Edit and delete (stories 15, 16)

- [ ] Clicking a Task in "งานล่าสุด" opens "แก้ไขงาน" with every field filled in
- [ ] Every field can be changed and optional fields cleared (open the date picker and press "ล้าง" for the start date); "บันทึกการแก้ไข" saves and closes
- [ ] "ลบงาน" asks "ลบงาน … ถาวร?"; "ไม่ลบ" keeps the Task; "ลบถาวร" removes it for good
- [ ] Escape and "ยกเลิก" close the form without saving

### Calendar month View (stories 20 to 33)

- [ ] The title shows the month with a BE year, such as "พฤศจิกายน 2569"; weeks start on จันทร์
- [ ] Today has a filled circle on its date
- [ ] ‹ and › change month and the Tasks change with them; "วันนี้" comes back to this month
- [ ] A Task with a start date is one bar from start date to due date, also across a month or week end
- [ ] A Task without a start date sits on its due date only
- [ ] Colours follow Priority (สูง orange, กลาง yellow, ต่ำ blue); an Overdue Task is red and stays on its due date
- [ ] A timed Task shows its start time
- [ ] Clicking a Task opens "แก้ไขงาน" over the Calendar; saving or deleting updates the Calendar at once
- [ ] The circle before a Task ticks it done: a toast says "ทำเสร็จแล้ว", the name is struck through and an Overdue Task is no longer red. Clicking the circle does not open the form
- [ ] A done Task is undone by lowering Progress in the form
- [ ] Tab reaches each Task; Enter opens it

### Theme and motion (stories 61 to 64)

- [ ] The moon/sun button switches light and dark; the choice is kept after a reload, with no flash of the other theme
- [ ] The calendar, form, date picker and toasts are readable in both themes
- [ ] Changing page fades the page in; the edit form slides up when it opens and down when it closes; a ticked circle pops in. Each is quick, well under half a second
- [ ] With reduced motion on (Windows: Settings → Accessibility → Visual effects → Animation effects off), none of those animations run
- [ ] The calendar grid itself never animates, even with motion on

## Phone (http://<this machine's IP>:3000)

- [ ] Sign-in works, and the bottom menu shows ภาพรวม, ตารางงาน, เพิ่มงาน, ตารางชีวิต, เพิ่มเติม; only ตารางงาน and เพิ่มงาน are enabled
- [ ] ตารางงาน is a compact month: days with Tasks have coloured dots (red for Overdue, faded for done); today has a filled circle (D10, story 34)
- [ ] Today is selected and its Tasks are listed below the month; tapping another day lists that day's Tasks, including multi-day Tasks covering it
- [ ] Tapping the circle before a Task ticks it done; tapping the Task opens the edit form, which fits the screen and scrolls (story 35)
- [ ] ‹, › and "วันนี้" work; another month selects its first day
- [ ] เพิ่มงาน: the form fits the screen, the date picker opens and picks, and saving shows a toast
- [ ] No page scrolls sideways; text is readable without zooming
- [ ] Turning the phone to landscape, or a wide tablet, switches to the computer Calendar

## After the test

- [ ] `docker compose down` then `docker compose up -d`: everything is still there and you are still signed in (if you chose to be remembered)
- [ ] Write down anything that failed, with the page, the steps and what you saw
