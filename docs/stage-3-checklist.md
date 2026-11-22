# Stage 3 hand-test checklist

The Owner's whole-system test after stage 3, on the real machine (T4). Tick each line; anything that fails becomes a ticket.

Stage 3 adds the Overview (ภาพรวม), the first page after sign-in. Every list and number on it comes from `GET /api/overview` (D32).

## Before you start

- [ ] `docker compose up -d --build` in the parent folder finishes, and `docker compose ps` shows `db`, `api` and `web` running
- [ ] Some Tasks exist: one due today without a time, one due today with a time, one multi-day Task covering today, one done Task due today, two or three Overdue Tasks (one from an earlier month), one Task due later this month, one due next month, and Tasks in two or three Categories plus one without a Category

## Computer (http://localhost:3000)

### Landing (story 36)

- [ ] Signing in opens ภาพรวม; opening `http://localhost:3000/` also lands there
- [ ] ภาพรวม is highlighted in the left menu

### งานวันนี้ (story 36, D30)

- [ ] The card shows today's date with a BE year and the number of Tasks
- [ ] It lists every Task covering today, including the multi-day one; Tasks due tomorrow or yesterday are not here
- [ ] Tasks without a time come first, then timed Tasks by start time; each shows its time, Status and Priority colour
- [ ] The done Task is struck through with a filled tick
- [ ] Ticking a Task's circle shows "ทำเสร็จแล้ว" and strikes it through; clicking a Task shows it, แก้ไข opens the form, and saving or deleting updates the card
- [ ] With no Tasks today the card says "วันนี้ไม่มีงาน"

### งานเลยกำหนด (story 37, D23)

- [ ] Every Overdue Task is listed in red with "ครบกำหนด" and its BE date, oldest first, including the one from an earlier month
- [ ] A Task due today is not here
- [ ] Ticking a Task removes it from the list; changing its due date to today in the form moves it to งานวันนี้
- [ ] With none, the card says "ไม่มีงานเลยกำหนด"

### สรุปเดือนนี้ (story 38)

- [ ] The heading names this month with a BE year
- [ ] ทั้งหมด, เสร็จแล้ว, กำลังทำ and เลยกำหนด count only Tasks due this month (the Task due next month is not counted; a Task started last month but due this month is)
- [ ] The numbers count up quickly when the page opens
- [ ] Ticking a Task updates the numbers
- [ ] Cards lift slightly under the mouse

### Charts (story 39)

- [ ] งานตามสถานะ is a donut with the total in the middle and ยังไม่เริ่ม, กำลังทำ, เสร็จแล้ว with their numbers beside it; they add up to ทั้งหมด
- [ ] งานตามหมวดหมู่ has one bar per Category with Tasks due this month, largest first, and ไม่มีหมวดหมู่ last when there are uncategorised Tasks; a Category with no Tasks this month is not shown
- [ ] A long Category name ends in "…"; hovering the bar shows the count
- [ ] Switching to the dark theme recolours the charts with no reload
- [ ] In a month with no Tasks, a short message replaces the charts

### Reduced motion (story 63)

- [ ] With reduced motion turned on in the operating system, the numbers and charts appear at once without animating

## Phone (narrower than 768 px)

- [ ] Signing in opens ภาพรวม; ภาพรวม is highlighted in the bottom menu
- [ ] Cards stack in one column: งานวันนี้, งานเลยกำหนด, สรุปเดือนนี้ (two by two), then the two charts
- [ ] Nothing runs off the right edge; long Task names end in "…"
- [ ] Ticking and opening Tasks work as on the computer

## Regression

- [ ] The Calendar and Task entry pages still work as in the stage 1 and stage 2 checklists; the phone Calendar's day list looks and works as before
