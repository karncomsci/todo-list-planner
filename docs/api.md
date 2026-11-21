# Planner API

The contract between `planner-web` and `planner-api` (D13). A change to any shape here is made in the same ticket as the Go handler and the web's API types file.

## Conventions

- **Base path**: every endpoint is under `/api`. The browser calls the web origin; the web forwards `/api/*` to the API unchanged (D4).
- **Format**: JSON request and response bodies, `Content-Type: application/json`.
- **Dates and times**: CE only (D9). Dates are `YYYY-MM-DD`; times of day are `HH:MM`; timestamps are RFC 3339. "Today" is the date in Asia/Bangkok.
- **Authentication**: the session travels in the httpOnly cookie `planner_session` (D17). Every endpoint needs it except health, sign-in and sign-out. Without a valid session the answer is 401 `unauthorized`, also for unknown paths, and an invalid cookie is cleared in that response.
- **Owner scope**: every endpoint reads and writes only the signed-in Owner's data (D19). Another Owner's resource answers 404 `not_found`, as if it did not exist.

## Errors (D15)

Every error, on every endpoint, has this shape:

```json
{ "error": { "code": "required", "message": "due date is required", "field": "dueDate" } }
```

| Field | Meaning |
|---|---|
| `code` | Stable machine-readable code. The web chooses the Thai text to show from `code` and `field` |
| `message` | English text for developers and logs |
| `field` | Present only on validation errors: the request field that failed |

| Code | Status | When |
|---|---|---|
| `bad_request` | 400 | The body is not a JSON object |
| `unauthorized` | 401 | No valid session |
| `invalid_credentials` | 401 | Sign-in with a wrong email or password; the two are not told apart |
| `not_found` | 404 | No such route, or no such resource for this Owner |
| `method_not_allowed` | 405 | The route exists but not for this method |
| `payload_too_large` | 413 | The request body is larger than the server accepts |
| `unsupported_media_type` | 415 | The request body is not sent as JSON |
| `too_many_attempts` | 429 | More than 10 failed sign-ins within a minute |
| `internal` | 500 | Unexpected failure; details are logged, never returned |
| `database_unavailable` | 503 | The database does not answer |

**Validation errors** answer 422 and always carry `field`. The code names the rule that failed:

| Code | Rule |
|---|---|
| `required` | The field is missing or empty |
| `too_long` | Text is longer than allowed |
| `invalid_date` | Not a real date in `YYYY-MM-DD` |
| `out_of_range` | A number outside the allowed range |
| `invalid_time` | Not a time of day in `HH:MM` |
| `invalid_choice` | Not one of the allowed values |
| `start_after_due` | `startDate` is after `dueDate` |
| `end_before_start` | On a one-day Task, `endTime` is not after `startTime` |
| `duplicate` | The Owner already has one with this name |

The web's API client adds two codes of its own, never sent by the API: `network` when the server cannot be reached, and `internal` when a response is not JSON (for example while the API is down behind the web).

## Endpoints

### Health

`GET /api/health`: the API is up and the database answers. No session needed.

- 200 `{ "status": "ok" }`
- 503 `database_unavailable`

### Session

The Owner account is created on first start from `OWNER_EMAIL` and `OWNER_PASSWORD` when no Owner exists, and never again (D16). Emails are compared case-insensitively.

`POST /api/session`: sign in. No session needed.

```json
{ "email": "owner@example.com", "password": "…", "remember": true }
```

- 200 `{ "owner": { "id": 1, "email": "owner@example.com" } }` and sets the session cookie. With `remember` the cookie lasts 30 days; without it the cookie ends when the browser closes, and the server stops honouring it after 24 hours (A2).
- 422 `required` on `email` or `password`
- 401 `invalid_credentials`
- 429 `too_many_attempts`

`GET /api/session`: the signed-in Owner.

- 200 `{ "owner": { "id": 1, "email": "owner@example.com" } }`
- 401 `unauthorized`

`DELETE /api/session`: sign out. Deletes the session at once and clears the cookie (D17). Succeeds without a session too.

- 204, no body

### Task

A Task as every Task endpoint returns it (D20). `status` and `isOverdue` are derived when read and never stored (D21, D23).

```json
{
  "id": 7,
  "name": "ส่งรายงาน",
  "dueDate": "2026-11-25",
  "startDate": null,
  "startTime": null,
  "endTime": null,
  "priority": "medium",
  "progress": 0,
  "status": "not_started",
  "isOverdue": false,
  "note": "",
  "category": { "id": 3, "name": "งานบ้าน" },
  "completedAt": null,
  "createdAt": "2026-11-21T05:00:00Z",
  "updatedAt": "2026-11-21T05:00:00Z"
}
```

| Field | Meaning |
|---|---|
| `priority` | `high`, `medium` or `low`; `medium` when not given |
| `progress` | 0 to 100 |
| `status` | `not_started` at 0, `in_progress` at 1 to 99, `done` at 100 (D21) |
| `isOverdue` | Due date before today in Thailand and progress below 100. A Task due today is not overdue (D23, A5) |
| `category` | The Task's Category, or `null` when it has none (D24) |
| `completedAt` | Set when progress reaches 100, null below (D22) |

`POST /api/tasks`: create a Task. Only `name` and `dueDate` are required; for the other fields, absent, `null` and `""` all mean none.

```json
{
  "name": "ประชุมสรุปโครงการ",
  "dueDate": "2026-11-27",
  "startDate": "2026-11-25",
  "startTime": "09:00",
  "endTime": "10:30",
  "priority": "high",
  "progress": 40,
  "note": "เตรียมสไลด์",
  "categoryId": 3
}
```

- 201 `{ "task": Task }`. Name and note are stored trimmed. `completedAt` is the save time when `progress` is 100 (D22).
- 422, on the first field that breaks a rule:

| Field | Codes |
|---|---|
| `name` | `required`, `too_long` (over 200 characters) |
| `dueDate` | `required`, `invalid_date` |
| `startDate` | `invalid_date`, `start_after_due` (may equal `dueDate`) |
| `startTime`, `endTime` | `invalid_time`; `required` when only the other one is given (A1); `end_before_start` on `endTime` when the Task has no start date or starts on its due date. On a multi-day Task the start time belongs to the start date and the end time to the due date, so any pair is accepted |
| `priority` | `invalid_choice` |
| `progress` | `out_of_range` (0 to 100) |
| `note` | `too_long` (over 2000 characters) |
| `categoryId` | `invalid_choice` when it is not one of the Owner's Categories (another Owner's Category counts as unknown) |

`GET /api/tasks/{id}`: one Task.

- 200 `{ "task": Task }`
- 404 `not_found` when the Owner has no Task with this ID

`PUT /api/tasks/{id}`: replace every field of a Task (story 15). The body and its rules are the same as create, so an optional field left out, `null` or `""` is cleared, and `priority` and `progress` return to `medium` and 0. `createdAt` stays; `updatedAt` becomes the save time. `completedAt` takes the save time when `progress` reaches 100, keeps its first value while `progress` stays at 100, and is cleared below 100 (D22).

- 200 `{ "task": Task }`
- 422 as for create
- 404 `not_found` when the Owner has no Task with this ID

`DELETE /api/tasks/{id}`: delete a Task permanently; there is no trash (D25).

- 204, no body
- 404 `not_found` when the Owner has no Task with this ID

`GET /api/tasks?from=YYYY-MM-DD&to=YYYY-MM-DD`: every Task whose span touches the range, both ends inclusive, for the Calendar (D14). A Task spans from its `startDate`, or its `dueDate` when it has none, to its `dueDate`, so a multi-day Task that starts before `from` or ends after `to` is included. Ordered by first day, then Tasks without a time before timed ones, then by start time.

- 200 `{ "tasks": [Task, …] }`
- 422 on `from` or `to`: `required`, `invalid_date`; on `to`: `out_of_range` when it is before `from` or the range is longer than 400 days

`GET /api/tasks?recent=N`: the N most recently changed Tasks, newest first, for the list beside the Task form (story 17). When `recent` is given, `from` and `to` are ignored.

- 200 `{ "tasks": [Task, …] }`
- 422 on `recent`: `out_of_range` (N must be 1 to 50)

### Category

A Category groups Tasks (D24). List and create are reached from the Task form; rename and delete from Settings (stories 55, 56).

```json
{ "id": 3, "name": "งานบ้าน" }
```

`GET /api/categories`: the Owner's Categories, by name ignoring letter case.

- 200 `{ "categories": [Category, …] }`

`POST /api/categories`: create a Category.

```json
{ "name": "งานบ้าน" }
```

- 201 `{ "category": Category }`. The name is stored trimmed.
- 422 on `name`: `required`, `too_long` (over 50 characters), `duplicate` (names are unique per Owner, ignoring letter case and surrounding spaces)

`PUT /api/categories/{id}`: rename a Category (story 55). The body and its rules are the same as create; renaming to its own name in another letter case is allowed. Its Tasks keep it.

- 200 `{ "category": Category }`
- 422 on `name` as for create
- 404 `not_found` when the Owner has no Category with this ID

`DELETE /api/categories/{id}`: delete a Category. Its Tasks stay, with `category: null` (D24, story 56).

- 204, no body
- 404 `not_found` when the Owner has no Category with this ID

### Overview

The Overview shows the current state only (D30). Every list and number on it is calculated here; the web only displays them (D32).

`GET /api/overview`: the Owner's Overview as of today in Thailand.

```json
{
  "today": "2026-11-21",
  "todayTasks": [Task, …],
  "overdueTasks": [Task, …],
  "month": {
    "month": "2026-11",
    "total": 12,
    "done": 5,
    "inProgress": 4,
    "overdue": 2,
    "byStatus": { "not_started": 3, "in_progress": 4, "done": 5 },
    "byCategory": [
      { "category": { "id": 3, "name": "งานบ้าน" }, "count": 7 },
      { "category": null, "count": 5 }
    ]
  }
}
```

| Field | Meaning |
|---|---|
| `today` | Today's date in Thailand, the day the lists below are worked out for |
| `todayTasks` | Every Task whose span covers today: from its `startDate`, or its `dueDate` when it has none, to its `dueDate`. Done Tasks are included. Ordered as listing by date range: by first day, then Tasks without a time before timed ones, then by start time (story 36) |
| `overdueTasks` | Every Overdue Task, however old: due before today and progress below 100 (D23). A Task due today is not here (A5). Ordered by due date, oldest first, then by name (story 37) |
| `month` | This month's summary (story 38). `month` is the current month in Thailand as `YYYY-MM` (CE). The counts cover the Tasks whose `dueDate` falls in that month: `total` all of them, `done` those at progress 100, `inProgress` those at 1 to 99 (D21), `overdue` those overdue now (D23) |
| `month.byStatus` | The same Tasks per Status, for the Status chart (story 39). All three Statuses are present, at 0 when empty, and they add up to `total` |
| `month.byCategory` | The same Tasks per Category, for the Category chart (story 39). Only Categories with at least one of these Tasks appear. Uncategorised Tasks are one entry with `category: null`, present only when there are some, and always last. The others are ordered by count, largest first, then by name |

- 200 with the body above

### Routine

The Routine is one template per Owner: a text entry for each hour from 05:00 to 23:00, with no ticking and no history (D26). It never appears on the Calendar (D29).

```json
{ "entries": [{ "hour": 5, "text": "Wake up" }, { "hour": 6, "text": "" }, …] }
```

Every answer carries all nineteen hours, 5 to 23 in order; `text` is `""` for an empty hour.

`GET /api/routine`: the Owner's Routine.

- 200 with the body above

`PUT /api/routine`: replace the whole template (stories 40, 41). The body has the same shape; an hour left out, or sent with empty text, becomes empty. Text is stored trimmed.

- 200 with the saved Routine, all nineteen hours
- 422 on `entries`: `out_of_range` when an hour is not 5 to 23 or is given twice, `too_long` when a text is over 200 characters. Nothing is saved.

`DELETE /api/routine`: clear every hour in one step (story 42).

- 204, no body

### Daily Checklist

One checklist per Owner per day (D27): glasses of water drunk, three meals each with a menu and a tick, and one Reminder Note. A day with no record is an empty checklist; past days are kept for Reports (stories 46, 47). It never appears on the Calendar (D29).

```json
{
  "date": "2026-11-22",
  "glasses": 5,
  "breakfastMenu": "Rice soup",
  "breakfastDone": true,
  "lunchMenu": "",
  "lunchDone": false,
  "dinnerMenu": "",
  "dinnerDone": false,
  "note": "Drink more water"
}
```

`GET /api/checklists/{date}`: the checklist for a CE date.

- 200 `{ "checklist": Checklist }`; zeros, `""` and `false` when the day has no record
- 422 on `date`: `invalid_date`

`PUT /api/checklists/{date}`: create or replace the whole checklist for that date. The body is a Checklist without `date`; a field left out takes its empty value. Texts are stored trimmed.

- 200 `{ "checklist": Checklist }`
- 422, on the first field that breaks a rule:

| Field | Codes |
|---|---|
| `date` | `invalid_date` |
| `glasses` | `out_of_range` (0 to 30) |
| `breakfastMenu`, `lunchMenu`, `dinnerMenu` | `too_long` (over 100 characters) |
| `note` | `too_long` (over 1000 characters) |

### Settings

The Owner's settings (D28).

```json
{ "waterGoal": 8 }
```

`GET /api/settings`: the Owner's settings; `waterGoal` is 8 until changed (A4).

- 200 `{ "settings": Settings }`

`PUT /api/settings`: save the settings (story 57). The Daily Checklist shows this many glasses, and Reports compare the water average with it.

- 200 `{ "settings": Settings }`
- 422 on `waterGoal`: `required`, `out_of_range` (1 to 30 glasses)

### Reports

The six Reports metrics for a period (D31), all calculated here (D32). The web turns the four period choices (this week, this month, this year, custom) into a range.

`GET /api/reports?from=YYYY-MM-DD&to=YYYY-MM-DD`: the report for a CE range, both ends inclusive.

```json
{
  "report": {
    "from": "2026-11-01",
    "to": "2026-11-30",
    "total": 7,
    "completedPerWeek": [{ "weekStart": "2026-10-26", "count": 0 }, { "weekStart": "2026-11-02", "count": 2 }, …],
    "onTime": { "onTime": 3, "late": 1, "notDone": 1, "share": 0.6 },
    "byCategory": [{ "category": { "id": 3, "name": "Work" }, "count": 3 }, { "category": null, "count": 2 }],
    "byPriority": { "high": 2, "medium": 3, "low": 2 },
    "overdue": 1,
    "water": { "averageGlasses": 1.0, "days": 21 },
    "allMealsDays": 2
  }
}
```

| Field | Meaning |
|---|---|
| `total` | Tasks whose `dueDate` is in the range: the set `onTime`, `byCategory`, `byPriority` and `overdue` count (A6) |
| `completedPerWeek` | Every Monday-start week touching the range, in order, zeros included; `count` is the Tasks whose `completedAt`, as a date in Thailand, falls in that week and in the range, whatever their due date (story 49, D22) |
| `onTime` | Over the settled Tasks due in the range, that is done or due before today: `onTime` done on or before the due date (in Thailand), `late` done after it, `notDone` overdue. `share` is `onTime` over all three, from 0 to 1, or null when none are settled. Tasks still ahead do not count (story 50, D31) |
| `byCategory` | Tasks due in the range per Category, as in the Overview: largest first, then by name; uncategorised last as `category: null`, only when there are some (story 51) |
| `byPriority` | Tasks due in the range per Priority; all three always present (story 51) |
| `overdue` | Tasks due in the range that are overdue now (story 52, D23) |
| `water` | `days` is the number of the range's days up to today; `averageGlasses` the glasses over those days divided by `days`, a day without a record counting as 0 (D27). When the whole range is after today, `days` is 0 and `averageGlasses` null (story 53) |
| `allMealsDays` | Days in the range, up to today, with all three meals ticked (story 53) |

- 200 with the body above
- 422 on `from` or `to`, as for listing Tasks by date range: `required`, `invalid_date`; on `to`: `out_of_range` when it is before `from` or the range is longer than 400 days

### Password

`PUT /api/password`: change the Owner's password after confirming the current one (story 54). The new password is stored as a one-way hash (D18).

```json
{ "currentPassword": "correct-horse", "newPassword": "battery-staple" }
```

- 204, no body. Every other session of the Owner ends at once; the session that made the change stays signed in (D17).
- 422, on the first field that breaks a rule:

| Field | Codes |
|---|---|
| `currentPassword` | `required`; `incorrect` when it is not the current password |
| `newPassword` | `required`; `too_short` (under 8 characters, as for the initial password); `too_long` (over 72 bytes, the most the hash reads) |
