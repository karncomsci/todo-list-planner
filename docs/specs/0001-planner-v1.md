# Spec 0001: Task Calendar Planner, first release

| | |
|---|---|
| Status | Approved. Stages 1 to 6 built: the first release is complete (tickets 01 to 26 in `docs/tickets/`). Next step: the Owner hand-tests stages 3 to 6 with the checklists in `docs/` |
| Document version | 17 |
| Date | 21 Nov 2026 |
| Source | Synthesised from a 36-question design interview (Q1 to Q36) and the mockups |
| Vocabulary | Follows GLOSSARY.md in the parent folder (see the term table below) |

This document is meant to change. See "Changing this spec" at the end. Every decision has an ID (D1, D2, ...) so it can be referenced and changed one at a time.

## Terms

GLOSSARY.md is written in Thai and stays the source of truth for meaning. This spec uses the English names below. The user interface shows the Thai names.

| English (this spec) | Thai (glossary and UI) |
|---|---|
| Owner | เจ้าของ |
| Task | งาน |
| Status | สถานะ |
| Progress | ความคืบหน้า |
| Priority | ความสำคัญ |
| Category | หมวดหมู่ |
| Overdue Task | งานเลยกำหนด |
| Calendar (page) | ตารางงาน |
| View | มุมมอง |
| Life Schedule | ตารางชีวิต |
| Routine | กิจวัตร |
| Daily Checklist | เช็กลิสต์ประจำวัน |
| Water Goal | เป้าดื่มน้ำ |
| Reminder Note | โน้ตเตือนใจ |
| Overview | ภาพรวม |
| Reports | รายงาน |

## Problem Statement

The Owner wants one place to plan and track their own Tasks, usable on both a computer and a phone. They need to see which Task is due when, which Tasks are overdue, and how much they completed over a past period. They also want to track their daily Routine in the same place.

The off-the-shelf tool used as a reference is someone else's product, is tied to Google Sheets, and includes parts the Owner does not want. The Owner wants a system of their own where they control all the data and code, can review the code themselves, and can extend it later.

## Solution

A personal web app, working name "ปฏิทินตารางงาน" (Task Calendar Planner), for a single user, running on the Owner's machine with Docker. After sign-in it has six pages.

| Page | What the Owner can do |
|---|---|
| Calendar | See Tasks on a calendar in four Views: day, week, month, year |
| Task entry | Add, edit and delete Tasks |
| Overview | See today's Tasks, Overdue Tasks and this month's summary |
| Life Schedule | Set an hourly Routine and tick the Daily Checklist |
| Reports | See past results for a chosen period |
| Settings | Change password, manage Categories, set the Water Goal, back up and restore data |

The look is newly designed, modern, with short animations, light and dark themes, Thai language, and years shown in the Buddhist Era (BE).

## User Stories

### Sign-in

1. As the Owner, I want to sign in with an email and password, so that nobody else can open my data
2. As the Owner, I want the system to create my account on first run from configured values, so that no sign-up page is needed
3. As the Owner, I want to choose to stay signed in on this device, so that I do not type my password every time
4. As the Owner, I want to sign out, so that I can close access on a shared device
5. As the Owner, I want a clear message when my email or password is wrong, so that I know to try again
6. As the Owner, I want to be sent to the sign-in page when I open any page while signed out, so that data does not leak through direct links

### Task entry

7. As the Owner, I want to add a Task with only a name and a due date, so that I can capture work quickly
8. As the Owner, I want to set a start date, so that a Task spanning several days shows as a range
9. As the Owner, I want to set an optional start time and end time, so that I can record Tasks with fixed times such as meetings
10. As the Owner, I want to set Priority to high, medium or low, so that I can separate urgent work from the rest
11. As the Owner, I want to put a Task in a Category I named myself, or in none, so that Tasks are grouped my way
12. As the Owner, I want to set a Task's Progress as a percentage, so that I record how far it has got
13. As the Owner, I want Status to follow Progress automatically, so that I do not maintain two values that can disagree
14. As the Owner, I want to write a note on a Task, so that I keep details and things not to forget
15. As the Owner, I want to edit every field of a saved Task, so that I can adjust when plans change, confirming before the change is saved
16. As the Owner, I want to delete a Task with a confirmation step, so that I do not delete by mistake
17. As the Owner, I want to see recent Tasks beside the form, so that I can confirm the Task I just saved is there
18. As the Owner, I want a message naming the field that is wrong, such as a due date before the start date, so that I can fix it at once
19. As the Owner, I want to enter and see dates in BE years, so that they match what I use every day

### Calendar

20. As the Owner, I want to see the whole month's Tasks on a calendar, so that I get the month at a glance
21. As the Owner, I want to switch to week and day Views divided by hour, so that I can plan busy days
22. As the Owner, I want a year View, so that I see which parts of the year are busy
23. As the Owner, I want to move to the previous and next period and jump back to today in one step, so that I do not get lost
24. As the Owner, I want a Task with a start date shown as a bar from start date to due date, so that I know which period it covers
25. As the Owner, I want a Task without a start date shown only on its due date, so that the calendar stays uncluttered
26. As the Owner, I want Tasks without a time placed in the top row of the day and week Views, so that they do not mix with timed Tasks
27. As the Owner, I want Priority shown by colour, so that I find important Tasks fast
28. As the Owner, I want an Overdue Task shown in red and left on its original due date, so that I know which day I missed
29. As the Owner, I want completed Tasks shown struck through on the calendar, so that I see what is done without deleting it
30. As the Owner, I want to click a Task on the calendar to review it, with an edit button to change it, so that I do not look for it on another page and do not change it by accident
31. As the Owner, I want to tick a Task as done directly on the Calendar, so that I close it in one step
32. As the Owner, I want today clearly marked, so that I know where I am
33. As the Owner, I want weeks to start on Monday, so that they match my working week
34. As the Owner on a phone, I want a compact calendar with the list of Tasks for the selected day, so that it is readable on a small screen
35. As the Owner on a phone, I want to tick Tasks as done from that day's list, so that I can close work on the go

### Overview

36. As the Owner, I want to see today's Tasks as soon as I sign in, so that I know what to do first
37. As the Owner, I want to see every Overdue Task, so that nothing left behind slips out of sight
38. As the Owner, I want this month's summary (all Tasks, completed, in progress, overdue), so that I can judge my workload
39. As the Owner, I want charts of Tasks by Status and by Category, so that I read them at a glance

### Life Schedule

40. As the Owner, I want to type a Routine entry for each hour from 05:00 to 23:00, so that I shape my day
41. As the Owner, I want the Routine to be one template used every day, so that I do not re-enter it daily
42. As the Owner, I want to clear the whole Routine in one step, so that I can start over
43. As the Owner, I want to tick the number of glasses of water I drank today, so that I track my water intake
44. As the Owner, I want to type the menu and tick each of three meals, so that I see whether I ate all of them
45. As the Owner, I want to write today's Reminder Note, so that I record what I want to stress to myself
46. As the Owner, I want the Daily Checklist to start fresh when a new day begins, so that I do not clear it myself
47. As the Owner, I want past days' Daily Checklists kept, so that they can appear in Reports

### Reports

48. As the Owner, I want to choose the period as this week, this month, this year or a custom range, so that I look at the period I care about
49. As the Owner, I want Tasks completed per week, so that I see my trend
50. As the Owner, I want the share of Tasks completed on time, so that I know how well I estimate
51. As the Owner, I want Task counts by Category and by Priority, so that I know where my time went
52. As the Owner, I want the number of Overdue Tasks in the period, so that I measure how often work slips
53. As the Owner, I want average glasses of water per day and the number of days with all three meals ticked, so that I track daily habits

### Settings

54. As the Owner, I want to change my password after confirming the current one, so that I stop using the initial password
55. As the Owner, I want to add, rename and delete Categories, so that I adjust how Tasks are grouped
56. As the Owner, I want Tasks to remain when their Category is deleted, becoming uncategorised, so that I do not lose them
57. As the Owner, I want to set the Water Goal in glasses per day, so that the checklist matches my goal
58. As the Owner, I want to export all my data as one file, so that I keep a backup off the machine
59. As the Owner, I want to import a backup file that replaces all data after a confirmation step, so that I can recover when data is damaged

### Whole system

60. As the Owner, I want every page to work on computer and phone, so that I can use it anywhere
61. As the Owner, I want to switch between light and dark themes and have the choice remembered, so that it is comfortable day and night
62. As the Owner, I want short animations when changing pages, opening the form and ticking a Task done, so that the app feels alive
63. As the Owner with reduced motion enabled on my device, I want animations turned off automatically, so that they do not bother me
64. As the Owner, I want a message when a save succeeds or fails, so that I am sure my data was stored
65. As the Owner, I want to start the whole system with one command, so that I can use it without multi-step setup

## Implementation Decisions

### System structure

- ~~**D1 Two separate projects**: the web front end (Next.js) and the API (Go) are two separate git repositories inside one parent folder.~~ Replaced by D37 in version 12
- **D37 One repository, two projects**: the web front end (Next.js) and the API (Go) are two separate projects, each in its own folder (`planner-web/`, `planner-api/`) of one git repository. The repository root holds the glossary, specs, API documentation, tickets and the files that run the whole system. Reason: the Owner is fluent in Next.js and wants Go as a standalone API (Q7, Q12, Q17, ADR 0001); one repository keeps the documents under version control and lets an API change land on both sides and in `docs/api.md` in one commit (ADR 0002)
- **D2 Database**: PostgreSQL (Q7)
- **D3 Running**: on the Owner's machine with Docker Compose, which starts all three parts together. Moving to a server comes later and must not require code changes (Q14)
- **D4 Request path**: the browser talks to the web front end on one origin. The front end forwards API requests to Go, so no cross-origin setup is needed (Q20)

### Web front end

- **D5 Tools**: Next.js with the App Router, TypeScript, Tailwind CSS. Charts on the Overview and in Reports use Recharts (MIT licence), coloured from the theme's CSS variables so they follow D8 (Q21, Q30)
- **D6 Calendar**: FullCalendar standard bundle (MIT licence) for all four Views. The year View uses the multi-month view. No premium plugins (Q21)
- **D7 Animation**: the Motion library, used for page transitions, the form sliding in and out, ticking a Task done, numbers on the Overview, and cards that move on hover. Charts animate with Recharts' own animation instead of Motion. Each animation is shorter than 0.3 seconds and turns off when the device asks for reduced motion. No extra animation is added to the calendar grid (Q32)
- **D8 Theme**: light and dark, switchable, with the choice remembered in the browser (Q31)
- **D9 Language and dates**: Thai only. Years shown in BE. Weeks start on Monday. One time zone, Thailand. Conversion between BE and CE happens only in the front end; the API and database use CE (Q27). Times of day are 24-hour everywhere, whatever the device's clock setting; a time field names the part of the day beside the value: 00:00–04:59 late night, 05:00–11:59 morning, 12:00–12:59 noon, 13:00–15:59 afternoon, 16:00–18:59 evening, 19:00–23:59 night
- **D10 Layout**: a left menu on computers. On phones a bottom menu with five buttons: Overview, Calendar, Add Task, Life Schedule, and More, which holds Reports and Settings. The phone Calendar shows Tasks as coloured dots with the list for the selected day, and this compact calendar is the phone's main Calendar; the hourly day and week Views are designed for computers. On phones Settings stacks its cards in one column (Q8, Q30, mockups)
- **D11 API types**: the front end keeps all API data types in one place, written by hand, not generated from a specification (Q18)

### API

- **D12 Tools**: Go with Fiber as the framework, pgx for the database connection, sqlc to generate code from hand-written SQL, goose for migrations (Q19)
- **D13 Style**: REST with JSON. No OpenAPI. The API is documented in one Markdown file in the parent folder (Q18)
- **D14 API resources**:

| Resource | Actions |
|---|---|
| Session | Sign in, sign out, get current Owner |
| Password | Change |
| Task | List by date range, get one, create, update, delete |
| Category | List, create, rename, delete |
| Overview | Get current summary |
| Routine | Get template, save template, clear template |
| Daily Checklist | Get for a date, save for a date |
| Reports | Get for a date range |
| Settings | Get, save (Water Goal) |
| Backup | Export, import |

- **D15 Errors**: every error is returned as JSON in one shape with an error code and a message. Validation errors name the field that failed

### Authentication

- **D16 Account**: one Owner. No sign-up page. The account is created on first run from an initial email and password in the Docker configuration, and is not created again if an account already exists (Q15, Q29)
- **D17 Session**: stored in PostgreSQL and carried in an httpOnly cookie. Signing out deletes the session immediately (Q20)
- **D18 Password**: stored as a one-way hash. The real password is never stored or exported (Q29)
- **D19 Ready for more users**: every piece of data belongs to an Owner from the start, and every request reads and writes only the signed-in Owner's data (Q15)

### Data

- **D20 Task**: name (required), due date (required), start date, start time, end time, Priority, Category, Progress, note, completed-at time. The start date must not be after the due date. Tasks do not recur and have no assignee (Q2, Q4, Q6, Q9, A1)
- **D21 Status**: not stored as its own field. It is derived from Progress: 0 is not started, 1 to 99 is in progress, 100 is done. Ticking a Task done sets Progress to 100 (Q16)
- **D22 Completed-at time**: recorded when Progress reaches 100 and cleared when Progress drops below 100. Used for Tasks completed per week and Tasks completed on time in Reports
- **D23 Overdue Task**: a Task whose due date has passed and whose Progress is below 100. Computed when read, not stored. The system never moves a due date by itself. A Task due today is not overdue until the next day begins, even if it has a time (Q25, A5)
- **D24 Category**: names are unique per Owner. A Task has one Category or none. Deleting a Category leaves its Tasks uncategorised (Q9, Q26)
- **D25 Deleting a Task**: permanent, with no trash. Completed Tasks are never deleted automatically (Q26)
- **D26 Routine**: one text entry per hour from 05:00 to 23:00, one template per Owner, no ticking, no history (Q10, Q28)
- **D27 Daily Checklist**: one per Owner per day, holding glasses of water drunk, three meals (menu and tick each) and one Reminder Note. A day with no record is treated as an empty checklist. Past days are kept (Q10, Q28)
- **D28 Settings**: Water Goal in glasses per day, default 8 (Q23)
- **D29 Life Schedule is separate from Tasks**: Routine and Daily Checklist never appear on the Calendar (Q10)

### Overview and Reports

- **D30 Overview**: shows the current state only: today's Tasks, all Overdue Tasks, and this month's summary (Q11). Today's Tasks are those whose span covers today, a span running from the start date, or the due date when there is none, to the due date. This month's summary counts the Tasks whose due date falls in the current month in Thailand, and the charts by Status and by Category count that same set
- **D31 Reports**: four period choices (this week, this month, this year, custom) and six metrics: Tasks completed per week, share of Tasks completed on time, Task counts by Category and by Priority, number of Overdue Tasks, average glasses of water per day, number of days with all three meals ticked (Q11, Q33). The share completed on time counts only settled Tasks (done, or due before today), so Tasks still ahead do not count as late; the water average runs over the period's days up to today, a day without a record counting as 0 (D27)
- **D32 Calculation**: all Overview and Reports numbers are calculated by the API. The front end only displays them

### Backup and restore

- **D33 Export**: one JSON file with Tasks, Categories, Routine, all Daily Checklists and Settings, plus a format version number. No password and no sessions (Q23, Q34)
- **D34 Import**: replaces all of the Owner's data and does not merge. It either succeeds completely or changes nothing, and rejects files in the wrong format (Q34)

### Build order

| Stage | Content |
|---|---|
| 0 | Mockups of every page in stages 1 to 6 (full set approved by the Owner on 19 Nov 2026) |
| 1 | Sign-in, Task entry, Calendar month View, light and dark themes |
| 2 | Day, week and year Views |
| 3 | Overview |
| 4 | Life Schedule |
| 5 | Reports |
| 6 | Settings |
| 7 | LINE notifications, outside this spec |

- **Stage 1 Categories**: stage 1 includes Category list and create, reached from the Task form so a Task can be put in a Category (story 11). Rename and delete arrive with Settings in stage 6
- **D35**: every stage ends with a working system. Real use can begin after stage 1 (Q22)
- **D36 Delivery**: the developer writes the code and runs the test suite. The Owner reviews, tests on the real machine, and commits (Q13, Q35)

## Testing Decisions

A good test in this project checks only behaviour visible from outside: send a request, then check the response and its consequences. It does not check which functions run inside or how the SQL is written. Tests like this survive refactoring.

- **T1 One main test seam, the API's HTTP boundary**: the test suite sends real HTTP requests to the API connected to a real PostgreSQL database, with no database mocking, covering every resource in D14 (Q35)
- **T2 What must be tested at the HTTP boundary**:
  - Sign-in success and failure, requests without a session are rejected, a session is unusable after sign-out
  - The Status rule in D21 and the completed-at time in D22
  - Overdue Tasks per D23, including the edge case that a Task due today is not yet overdue
  - Task validation, such as missing name, missing due date, start date after due date
  - Listing Tasks by date range, including multi-day Tasks that cross the edge of the range
  - Deleting a Category leaves its Tasks in place and uncategorised
  - Daily Checklists are separate per day, and a day with no record returns an empty checklist
  - All six Reports metrics against a data set with known answers
  - Export followed by import yields the same data, and importing a malformed file leaves existing data unchanged
  - One Owner's data is invisible to another, confirming D19
- **T3 Web front end**: test only calculation that does not depend on the screen: BE date conversion and formatting, and turning Task data into the shape the calendar needs (multi-day Tasks, Tasks without a start date, Tasks without a time). No automated screen tests in this release (Q35)
- **T4 Whole-system testing**: the Owner tests by hand on the real machine after each stage, on computer and phone (Q35)
- **T5 Prior art**: the project has no code yet, so there are no existing tests to follow. The stage 1 test suite becomes the pattern for later stages

## Out of Scope

- LINE notifications, which are stage 7 and need their own spec (Q5)
- Recurring Tasks (Q6)
- Multiple users, sign-up, permissions and an assignee field (Q2, Q15)
- Forgotten-password and email reset
- Trash and recovery of deleted Tasks (Q26)
- Setting a system name and logo from Settings, and Google Sheets integration (Q23)
- Merging imported data with existing data, and importing from other tools (Q34)
- Routines that differ by day of the week, and ticking Routine entries (Q10, Q28)
- Languages other than Thai, and other time zones (Q27)
- Moving to a server, domain setup and HTTPS (Q14)
- OpenAPI and automatic type generation (Q18)
- Dragging Tasks on the calendar to change dates, which has not been discussed
- Offline use

## Further Notes

### Assumptions

These were decided by the spec author to make the spec complete. Unconfirmed ones should be confirmed or changed before the stage they affect.

| ID | Assumption | Affects stage | State |
|---|---|---|---|
| A1 | A Task has both a start time and an end time, so the day View can show its length | 1, 2 | Confirmed |
| A2 | "Stay signed in" keeps the session for 30 days. Without it the session ends when the browser closes | 1 | Confirmed |
| A3 | Categories have no colour of their own. Calendar colour comes from Priority only | 1 | Confirmed |
| A4 | The default Water Goal is 8 glasses | 4 | Confirmed |
| A5 | A Task due today is not overdue until the next day begins, even when it has a time | 1, 3 | Confirmed |
| A6 | The share of Tasks completed on time counts Tasks whose due date falls in the chosen period | 5 | Confirmed |
| A7 | The system name "ปฏิทินตารางงาน" and the colour set in the mockups are provisional | 1 | Confirmed |

### Open items

- Stage 1 is broken into tickets 01 to 11, stage 2 into tickets 12 to 14 and stage 3 into tickets 15 to 18 in `docs/tickets/`, one Markdown file each, with blocking edges. Stages 1 to 6 are built; stage 7 (LINE notifications) needs its own spec
- The dark theme has a mockup for one page only (Calendar month View); other pages follow the same colour set
- This spec has not been published to an issue tracker because the project has none configured; tickets live as local files instead

### Changing this spec

- Edit this file directly, then raise the document version and add one line to the table below
- Refer to decisions by ID, for example "change D20". A retired ID is never reused: strike it through and say which ID replaces it
- If a change alters the meaning of a term, update GLOSSARY.md in the same change
- If a change is hard to reverse and had real alternatives, such as switching database or framework, write an ADR with it
- A large new feature, such as LINE notifications, gets a new spec instead of extending this one

| Version | Date | Change |
|---|---|---|
| 1 | 19 Nov 2026 | First version |
| 2 | 19 Nov 2026 | Owner approved the stage 1 mockups and confirmed A1, A2, A5 |
| 3 | 19 Nov 2026 | Stage 0 widened to mockups of every page, at the Owner's request to finish the whole plan before coding |
| 4 | 19 Nov 2026 | Translated to English. Added the term table and the state column for assumptions. The Thai text of version 3 is kept beside this file for reference |
| 5 | 19 Nov 2026 | Owner approved the full mockup set, confirmed A3, A4, A6, A7, and accepted the compact calendar as the phone Calendar (D10) |
| 6 | 19 Nov 2026 | ADR 0001 written and linked from D1 |
| 7 | 20 Nov 2026 | Stage 1 broken into tickets 01 to 11 in `docs/tickets/`. Owner confirmed that stage 1 includes Category list and create from the Task form, with rename and delete left to stage 6 |
| 8 | 21 Nov 2026 | Stage 1 built. Stage 2 broken into tickets 12 to 14. Owner confirmed: the View switcher is for computers only (the phone keeps the compact calendar, D10), the month View stays the default, the chosen View is not remembered, and clicking a day does not jump to the day View |
| 9 | 21 Nov 2026 | Stage 2 built (tickets 12 to 14); hand-test checklist in `docs/stage-2-checklist.md` |
| 10 | 21 Nov 2026 | Stages 1 and 2 committed. Stage 3 broken into tickets 15 to 18. Owner confirmed: today's Tasks are those whose span covers today, this month's summary and its charts count Tasks due this month (D30), and charts use Recharts with its own animation (D5, D7) |
| 11 | 21 Nov 2026 | Stage 3 built (tickets 15 to 18); hand-test checklist in `docs/stage-3-checklist.md` |
| 12 | 21 Nov 2026 | Owner chose one git repository for the whole project: D1 retired and replaced by D37; ADR 0002 written. The two former repositories' histories are kept in the new one |
| 13 | 22 Nov 2026 | Owner asked for stages 4 to 6 to be built without stopping for approval. Broken into tickets 19 to 26; D31 now says how the on-time share and the water average treat days and Tasks still ahead |
| 14 | 22 Nov 2026 | Stages 4 to 6 built (tickets 19 to 26); hand-test checklists in `docs/stage-4-checklist.md` to `docs/stage-6-checklist.md`. Built without a decision change; choices the spec left open are recorded in the tickets and `docs/api.md` (password change ends other sessions; backup file format; Water Goal 1 to 30 glasses) |
| 15 | 22 Nov 2026 | Owner asked for 24-hour time fields that name the part of the day: added to D9. The Task form's start and end time are picked from an hour list (00–23, each naming its part of the day) and a minute list (every five minutes), not the browser's time picker, which follows the device's 12-hour setting |
| 16 | 22 Nov 2026 | Owner asked that clicking a Task (Calendar, Add Task's recent list, Overview) first shows it read-only, with an edit button that opens the form: story 30 reworded. Cancel in the form returns to the review |
| 17 | 22 Nov 2026 | Owner asked for a confirmation before an edited Task is saved: story 15 extended. The confirmation names the fields that changed; adding a new Task does not ask |
