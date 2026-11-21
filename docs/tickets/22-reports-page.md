# 22: Reports page and stage 5 wrap-up

**What to build:** The Reports page lets the Owner choose this week, this month, this year or a custom range, and shows the six metrics as numbers and charts (D31, stories 48 to 53). Stage 5 ends with a hand-test checklist.

**Repositories:** `planner-web`, root (checklist).

**Blocked by:** 21 (Reports API)

**Status:** done

- [x] `/reports` with a period choice: สัปดาห์นี้, เดือนนี้, ปีนี้, กำหนดเอง; custom uses the date picker for start and end (BE shown, CE sent, D9); เดือนนี้ is chosen on opening
- [x] The heading shows the chosen range in BE
- [x] Tasks completed per week as a bar chart, one bar per week labelled by its Monday (Recharts, D5)
- [x] On-time share as a percentage with its counts (ตรงเวลา, ล่าช้า, ยังไม่เสร็จ); "–" when nothing is settled
- [x] Bars by Category and by Priority, Priority bars in the Priority colours
- [x] Number of Overdue Tasks, average glasses per day against the Water Goal, and days with all three meals ticked
- [x] Charts follow the theme and animate under 0.3 s, not at all under reduced motion (D7, D8)
- [x] The Reports menu entry is enabled (on phones under More); the page works at computer and phone widths
- [x] Unit tests cover turning a period choice into a CE date range (T3)
- [x] A stage 5 hand-test checklist exists in `docs/` (T4)
- [x] Web checks pass
