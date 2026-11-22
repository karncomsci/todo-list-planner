# Stage 2 hand-test checklist

The Owner's whole-system test after stage 2, on the real machine (T4). Tick each line; anything that fails becomes a ticket.

Stage 2 adds the day, week and year Views to the Calendar on computers. The phone Calendar is unchanged from stage 1 (D10): rerun the phone section of `stage-1-checklist.md` only to confirm nothing broke.

## Before you start

- [ ] `docker compose up -d --build` in the parent folder finishes, and `docker compose ps` shows `db`, `api` and `web` running
- [ ] Some Tasks exist around today: one without a time, one with a start and end time today, one timed Task running over two days, one multi-day Task without a time, one Overdue Task, one done Task, and a few in other months of this year

## Computer (http://localhost:3000 → ตารางงาน)

### View switcher (stories 20 to 23)

- [ ] Above the Calendar: วัน, สัปดาห์, เดือน, ปี; เดือน is selected when the page opens
- [ ] Choosing another View, then reloading the page, opens on เดือน again (the choice is not remembered)
- [ ] In every View, ‹ and › move by one day, week, month or year, the Tasks change with them, and "วันนี้" comes back to today's period
- [ ] Clicking a day number does not change the View

### Week View (สัปดาห์, stories 21, 24 to 33)

- [ ] The title shows the week's days with a BE year, such as "16 – 22 พฤศจิกายน 2569"; a week crossing two months names both, such as "30 พฤศจิกายน – 6 ธันวาคม 2569"
- [ ] Columns run จันทร์ to อาทิตย์; today's column is tinted and its header is in the primary colour
- [ ] The View opens scrolled to 07:00 and the hours scroll up and down inside the Calendar
- [ ] Tasks without a time sit in the "ทั้งวัน" row at the top; a multi-day Task is one bar across its days there
- [ ] A timed Task sits from its start time to its end time; a timed Task over two days runs from its start time to the end of the first day and continues the next day up to its end time
- [ ] Colours follow Priority; an Overdue Task is red on its due date; a done Task is struck through and faded
- [ ] The circle ticks a Task done ("ทำเสร็จแล้ว"); clicking the Task shows it over the Calendar, and แก้ไข opens the form; saving or deleting updates the week at once

### Day View (วัน)

- [ ] The title is the full date, such as "วันเสาร์ที่ 21 พฤศจิกายน 2569"
- [ ] One column divided by hour, opening at 07:00, with the "ทั้งวัน" row at the top
- [ ] A multi-day Task covering the day appears on it; a Task of another day does not
- [ ] Tick and edit work as in the week View

### Year View (ปี, story 22)

- [ ] The title is the BE year, such as "พ.ศ. 2569"; twelve months are shown, each titled with its BE year, such as "มกราคม 2569"
- [ ] Each month's weeks start on จันทร์; today is marked
- [ ] Tasks appear in their months with Priority colours, red Overdue and struck-through done; a busy day shows "+N" for the rest
- [ ] Clicking a Task shows it, and แก้ไข opens the form; saving updates the year at once
- [ ] ‹ and › move to the previous and next year

### Theme

- [ ] All four Views are readable in light and dark

## After the test

- [ ] Write down anything that failed, with the View, the steps and what you saw
