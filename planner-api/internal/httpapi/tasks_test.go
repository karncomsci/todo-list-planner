package httpapi_test

import (
	"fmt"
	"net/http"
	"strings"
	"testing"
	"time"
)

// thailandNoon is 21 Nov 2026, 12:00 in Thailand.
var thailandNoon = time.Date(2026, 11, 21, 5, 0, 0, 0, time.UTC)

func createTask(t *testing.T, c *client, body map[string]any) map[string]any {
	t.Helper()
	res := c.do(http.MethodPost, "/api/tasks", body)
	if res.Status != http.StatusCreated {
		t.Fatalf("create task %v: %d %v", body, res.Status, res.Body)
	}
	return res.Body["task"].(map[string]any)
}

func listRecent(t *testing.T, c *client, n int) []any {
	t.Helper()
	res := c.do(http.MethodGet, fmt.Sprintf("/api/tasks?recent=%d", n), nil)
	if res.Status != http.StatusOK {
		t.Fatalf("list recent: %d %v", res.Status, res.Body)
	}
	return res.Body["tasks"].([]any)
}

func TestCreateTaskWithNameAndDueDateOnly(t *testing.T) {
	s := newTestServerAt(t, thailandNoon)
	owner := s.signedInOwner("owner@example.com")

	task := createTask(t, owner, map[string]any{"name": "  ส่งรายงาน  ", "dueDate": "2026-11-25"})

	want := map[string]any{
		"name":        "ส่งรายงาน",
		"dueDate":     "2026-11-25",
		"startDate":   nil,
		"startTime":   nil,
		"endTime":     nil,
		"priority":    "medium",
		"progress":    float64(0),
		"status":      "not_started",
		"isOverdue":   false,
		"note":        "",
		"completedAt": nil,
	}
	for key, value := range want {
		if task[key] != value {
			t.Errorf("%s = %#v, want %#v", key, task[key], value)
		}
	}
	if id, _ := task["id"].(float64); id <= 0 {
		t.Errorf("id = %v", task["id"])
	}
}

func TestCreateTaskNamesTheWrongField(t *testing.T) {
	s := newTestServer(t)
	owner := s.signedInOwner("owner@example.com")

	cases := []struct {
		body  map[string]any
		field string
		code  string
	}{
		{map[string]any{"dueDate": "2026-11-25"}, "name", "required"},
		{map[string]any{"name": "   ", "dueDate": "2026-11-25"}, "name", "required"},
		{map[string]any{"name": strings.Repeat("ก", 201), "dueDate": "2026-11-25"}, "name", "too_long"},
		{map[string]any{"name": "งาน"}, "dueDate", "required"},
		{map[string]any{"name": "งาน", "dueDate": "2026-02-30"}, "dueDate", "invalid_date"},
		{map[string]any{"name": "งาน", "dueDate": "25/11/2569"}, "dueDate", "invalid_date"},
	}
	for _, tc := range cases {
		assertValidation(t, owner.do(http.MethodPost, "/api/tasks", tc.body), tc.field, tc.code)
	}

	if got := listRecent(t, owner, 10); len(got) != 0 {
		t.Errorf("rejected Tasks were stored: %v", got)
	}
}

func TestNameOf200CharactersIsAccepted(t *testing.T) {
	s := newTestServer(t)
	owner := s.signedInOwner("owner@example.com")

	createTask(t, owner, map[string]any{"name": strings.Repeat("ก", 200), "dueDate": "2026-11-25"})
}

func TestTaskIsOverdueOnlyAfterItsDueDay(t *testing.T) {
	s := newTestServerAt(t, thailandNoon)
	owner := s.signedInOwner("owner@example.com")

	yesterday := createTask(t, owner, map[string]any{"name": "เมื่อวาน", "dueDate": "2026-11-20"})
	today := createTask(t, owner, map[string]any{"name": "วันนี้", "dueDate": "2026-11-21"})

	if yesterday["isOverdue"] != true {
		t.Error("a Task due yesterday is not overdue (D23)")
	}
	if today["isOverdue"] != false {
		t.Error("a Task due today is overdue before the day ends (A5)")
	}
}

func TestTodayFollowsThailandTime(t *testing.T) {
	// 20 Nov 2026, 17:30 UTC is already 21 Nov, 00:30 in Thailand.
	s := newTestServerAt(t, time.Date(2026, 11, 20, 17, 30, 0, 0, time.UTC))
	owner := s.signedInOwner("owner@example.com")

	task := createTask(t, owner, map[string]any{"name": "งาน", "dueDate": "2026-11-20"})

	if task["isOverdue"] != true {
		t.Error("overdue must use the date in Thailand, not UTC (D9)")
	}
}

func TestRecentTasksAreNewestFirstAndLimited(t *testing.T) {
	s := newTestServer(t)
	owner := s.signedInOwner("owner@example.com")
	for _, name := range []string{"แรก", "สอง", "สาม"} {
		createTask(t, owner, map[string]any{"name": name, "dueDate": "2026-11-25"})
	}

	got := listRecent(t, owner, 2)

	if len(got) != 2 {
		t.Fatalf("got %d Tasks, want 2", len(got))
	}
	if first, second := got[0].(map[string]any)["name"], got[1].(map[string]any)["name"]; first != "สาม" || second != "สอง" {
		t.Errorf("order = %v, %v; want สาม, สอง", first, second)
	}
}

func TestRecentNeedsAValidCount(t *testing.T) {
	s := newTestServer(t)
	owner := s.signedInOwner("owner@example.com")

	for _, bad := range []string{"0", "51", "abc", "-1"} {
		assertValidation(t, owner.do(http.MethodGet, "/api/tasks?recent="+bad, nil), "recent", "out_of_range")
	}
}

func TestTasksNeedASession(t *testing.T) {
	s := newTestServer(t)

	assertError(t, s.do(http.MethodPost, "/api/tasks", map[string]any{"name": "งาน", "dueDate": "2026-11-25"}), http.StatusUnauthorized, "unauthorized")
	assertError(t, s.do(http.MethodGet, "/api/tasks?recent=10", nil), http.StatusUnauthorized, "unauthorized")
}

func TestOwnersSeeOnlyTheirOwnTasks(t *testing.T) {
	s := newTestServer(t)
	alice := s.signedInOwner("alice@example.com")
	bob := s.signedInOwner("bob@example.com")
	createTask(t, alice, map[string]any{"name": "ของ alice", "dueDate": "2026-11-25"})

	bobs := listRecent(t, bob, 50)
	alices := listRecent(t, alice, 50)

	if len(bobs) != 0 {
		t.Errorf("bob sees another Owner's Tasks (D19): %v", bobs)
	}
	if len(alices) != 1 {
		t.Errorf("alice sees %d Tasks, want 1", len(alices))
	}
}

func TestCreateTaskWithEveryField(t *testing.T) {
	s := newTestServerAt(t, thailandNoon)
	owner := s.signedInOwner("owner@example.com")

	task := createTask(t, owner, map[string]any{
		"name":      "ประชุมสรุปโครงการ",
		"dueDate":   "2026-11-27",
		"startDate": "2026-11-25",
		"startTime": "09:00",
		"endTime":   "10:30",
		"priority":  "high",
		"progress":  40,
		"note":      "  เตรียมสไลด์  ",
	})

	want := map[string]any{
		"startDate": "2026-11-25",
		"startTime": "09:00",
		"endTime":   "10:30",
		"priority":  "high",
		"progress":  float64(40),
		"status":    "in_progress",
		"note":      "เตรียมสไลด์",
	}
	for key, value := range want {
		if task[key] != value {
			t.Errorf("%s = %#v, want %#v", key, task[key], value)
		}
	}
}

func TestEmptyOptionalFieldsMeanNone(t *testing.T) {
	s := newTestServer(t)
	owner := s.signedInOwner("owner@example.com")

	task := createTask(t, owner, map[string]any{
		"name": "งาน", "dueDate": "2026-11-25", "startDate": "", "startTime": "", "endTime": "", "note": "",
	})

	if task["startDate"] != nil || task["startTime"] != nil || task["endTime"] != nil {
		t.Errorf("empty optional fields were stored: %v", task)
	}
}

func TestStatusFollowsProgress(t *testing.T) {
	s := newTestServerAt(t, thailandNoon)
	owner := s.signedInOwner("owner@example.com")

	cases := []struct {
		progress  int
		status    string
		completed bool
	}{
		{0, "not_started", false},
		{1, "in_progress", false},
		{99, "in_progress", false},
		{100, "done", true},
	}
	for _, tc := range cases {
		task := createTask(t, owner, map[string]any{"name": "งาน", "dueDate": "2026-11-25", "progress": tc.progress})
		if task["status"] != tc.status {
			t.Errorf("progress %d: status = %v, want %s (D21)", tc.progress, task["status"], tc.status)
		}
		if got := task["completedAt"] != nil; got != tc.completed {
			t.Errorf("progress %d: completedAt = %v, want set %v (D22)", tc.progress, task["completedAt"], tc.completed)
		}
	}
}

func TestCompletedAtIsTheSaveTime(t *testing.T) {
	s := newTestServerAt(t, thailandNoon)
	owner := s.signedInOwner("owner@example.com")

	task := createTask(t, owner, map[string]any{"name": "งาน", "dueDate": "2026-11-25", "progress": 100})

	got, err := time.Parse(time.RFC3339Nano, task["completedAt"].(string))
	if err != nil || !got.Equal(thailandNoon) {
		t.Errorf("completedAt = %v, want %v", task["completedAt"], thailandNoon)
	}
}

func TestDoneTaskIsNeverOverdue(t *testing.T) {
	s := newTestServerAt(t, thailandNoon)
	owner := s.signedInOwner("owner@example.com")

	task := createTask(t, owner, map[string]any{"name": "งาน", "dueDate": "2026-11-01", "progress": 100})

	if task["isOverdue"] != false {
		t.Error("a done Task is overdue (D23)")
	}
}

func TestStartDateMayEqualButNotFollowDueDate(t *testing.T) {
	s := newTestServer(t)
	owner := s.signedInOwner("owner@example.com")

	createTask(t, owner, map[string]any{"name": "งาน", "dueDate": "2026-11-25", "startDate": "2026-11-25"})
	assertValidation(t,
		owner.do(http.MethodPost, "/api/tasks", map[string]any{"name": "งาน", "dueDate": "2026-11-25", "startDate": "2026-11-26"}),
		"startDate", "start_after_due")
}

func TestTimesComeInOrderedPairs(t *testing.T) {
	s := newTestServer(t)
	owner := s.signedInOwner("owner@example.com")
	base := func(extra map[string]any) map[string]any {
		body := map[string]any{"name": "งาน", "dueDate": "2026-11-25"}
		for k, v := range extra {
			body[k] = v
		}
		return body
	}

	cases := []struct {
		extra map[string]any
		field string
		code  string
	}{
		{map[string]any{"startTime": "09:00"}, "endTime", "required"},
		{map[string]any{"endTime": "10:00"}, "startTime", "required"},
		{map[string]any{"startTime": "10:00", "endTime": "10:00"}, "endTime", "end_before_start"},
		{map[string]any{"startTime": "10:00", "endTime": "09:00", "startDate": "2026-11-25"}, "endTime", "end_before_start"},
		{map[string]any{"startTime": "25:00", "endTime": "26:00"}, "startTime", "invalid_time"},
		{map[string]any{"startTime": "9:00", "endTime": "10:00"}, "startTime", "invalid_time"},
		{map[string]any{"startTime": "09:00", "endTime": "noon"}, "endTime", "invalid_time"},
	}
	for _, tc := range cases {
		assertValidation(t, owner.do(http.MethodPost, "/api/tasks", base(tc.extra)), tc.field, tc.code)
	}

	// Across days the end time belongs to the due date, so it may be earlier in the day.
	createTask(t, owner, base(map[string]any{"startDate": "2026-11-24", "startTime": "22:00", "endTime": "02:00"}))
}

func TestPriorityProgressAndNoteHaveLimits(t *testing.T) {
	s := newTestServer(t)
	owner := s.signedInOwner("owner@example.com")
	body := func(key string, value any) map[string]any {
		return map[string]any{"name": "งาน", "dueDate": "2026-11-25", key: value}
	}

	assertValidation(t, owner.do(http.MethodPost, "/api/tasks", body("priority", "urgent")), "priority", "invalid_choice")
	assertValidation(t, owner.do(http.MethodPost, "/api/tasks", body("progress", 101)), "progress", "out_of_range")
	assertValidation(t, owner.do(http.MethodPost, "/api/tasks", body("progress", -1)), "progress", "out_of_range")
	assertValidation(t, owner.do(http.MethodPost, "/api/tasks", body("note", strings.Repeat("ก", 2001))), "note", "too_long")
	createTask(t, owner, body("note", strings.Repeat("ก", 2000)))
}
