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

A Category groups Tasks (D24). Stage 1 has list and create, reached from the Task form; rename and delete arrive in stage 6.

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
