# Stage 4 hand-test checklist

The Owner's whole-system test after stage 4, on the real machine (T4). Tick each line; anything that fails becomes a ticket.

Stage 4 adds the Life Schedule (ตารางชีวิต): the Routine and the Daily Checklist. Neither appears on the Calendar (D29).

## Before you start

- [ ] `docker compose up -d --build` in the root folder finishes, and `docker compose ps` shows `db`, `api` and `web` running

## Computer (http://localhost:3000 → ตารางชีวิต)

### Routine (กิจวัตร, stories 40 to 42)

- [ ] ตารางชีวิต in the left menu opens the page; เช็กลิสต์ประจำวัน on the left, กิจวัตร on the right
- [ ] กิจวัตร has one field for every hour from 05:00 to 23:00
- [ ] Typing shows "ยังไม่ได้บันทึก"; บันทึกกิจวัตร saves with a toast; after a reload the text is still there
- [ ] Emptying a field and saving clears that hour
- [ ] ล้างทั้งหมด asks for confirmation; ไม่ล้าง keeps everything; ล้างทั้งหมด in the confirmation empties every hour
- [ ] The Routine is the same whichever day the checklist shows (one template, story 41)

### Daily Checklist (เช็กลิสต์ประจำวัน, stories 43 to 47)

- [ ] The card shows today's date with a BE year and "(วันนี้)"
- [ ] ดื่มน้ำ shows eight glasses (the default Water Goal) and "0 / 8 แก้ว"
- [ ] Pressing glass 3 fills three glasses; pressing glass 3 again leaves two; pressing glass 1 leaves one
- [ ] Ticking มื้อเช้า saves at once; typing a menu and leaving the field saves it
- [ ] Typing a โน้ตเตือนใจ and leaving the field saves it
- [ ] After a reload every value is still there
- [ ] ‹ shows yesterday: empty unless saved before; › and วันนี้ come back to today with its values
- [ ] Values saved on another day stay on that day (open it again with ‹)
- [ ] Stopping the API (`docker compose stop api`) and ticking a meal shows "บันทึกเช็กลิสต์ไม่สำเร็จ" and the tick goes back; `docker compose start api` afterwards

### Next day (story 46)

- [ ] On the next calendar day the page opens on an empty checklist, and yesterday's is still reachable with ‹

## Phone (narrower than 768 px)

- [ ] ตารางชีวิต in the bottom menu opens the page; the checklist comes first, then the Routine, in one column
- [ ] Glasses, ticks and fields are easy to press; nothing runs off the right edge

## Regression

- [ ] The Overview, Calendar and Task entry pages work as in the stage 1 to 3 checklists, and Routine and checklist entries never appear on the Calendar (D29)
