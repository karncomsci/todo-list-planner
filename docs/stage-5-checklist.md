# Stage 5 hand-test checklist

The Owner's whole-system test after stage 5, on the real machine (T4). Tick each line; anything that fails becomes a ticket.

Stage 5 adds Reports (รายงาน). Every number comes from `GET /api/reports` (D32).

## Before you start

- [ ] `docker compose up -d --build` in the root folder finishes, and `docker compose ps` shows `db`, `api` and `web` running
- [ ] This month has: two or three Tasks done before their due date, one done after its due date, one Overdue Task, one Task due later this month, Tasks in two Categories and one without, and Daily Checklists on a few past days (some with all three meals ticked)

## Computer (http://localhost:3000 → รายงาน)

### Period (story 48)

- [ ] The page opens on เดือนนี้, and the heading shows the month's first and last days with a BE year
- [ ] สัปดาห์นี้ shows Monday to Sunday of this week; ปีนี้ shows 1 มกราคม to 31 ธันวาคม of this BE year
- [ ] กำหนดเอง shows two date pickers (BE years); choosing an end before the start, or a range over 400 days, shows a message instead of a report

### Metrics (stories 49 to 53)

- [ ] งานครบกำหนดในช่วงนี้ counts Tasks due in the period
- [ ] งานที่ทำเสร็จต่อสัปดาห์ has one bar per week, labelled by its Monday; hovering names the week and the count
- [ ] ทำเสร็จตรงเวลา shows the percentage and ตรงเวลา / ล่าช้า / ยังไม่เสร็จ; Tasks due later than today are not counted; "–" when nothing is due yet
- [ ] งานตามหมวดหมู่ and งานตามความสำคัญ count Tasks due in the period; Priority bars use the Priority colours
- [ ] งานเลยกำหนด matches the Overdue Tasks due in the period
- [ ] ดื่มน้ำเฉลี่ยต่อวัน divides the glasses by every day of the period up to today (days without a checklist count as 0) and names the Water Goal
- [ ] วันที่กินครบ 3 มื้อ counts days with all three meals ticked
- [ ] Ticking a Task done elsewhere, then coming back, updates the numbers

### Look

- [ ] Switching to the dark theme recolours the charts
- [ ] With reduced motion turned on, numbers and charts appear without animating

## Phone (narrower than 768 px)

- [ ] เพิ่มเติม → รายงาน opens Reports and the More menu closes
- [ ] Number cards sit two to a row, charts below in one column; nothing runs off the right edge

## Regression

- [ ] Overview, Calendar, Task entry and Life Schedule work as in the earlier checklists
