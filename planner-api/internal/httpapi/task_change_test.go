package httpapi_test

import (
	"fmt"
	"net/http"
	"testing"
	"time"

	"planner-api/internal/httpapi"
)

func taskPath(task map[string]any) string {
	return fmt.Sprintf("/api/tasks/%v", task["id"])
}

func updateTask(t *testing.T, c *client, task map[string]any, body map[string]any) map[string]any {
	t.Helper()
	res := c.do(http.MethodPut, taskPath(task), body)
	if res.Status != http.StatusOK {
		t.Fatalf("update task %v: %d %v", body, res.Status, res.Body)
	}
	return res.Body["task"].(map[string]any)
}

func completedAtOf(t *testing.T, task map[string]any) *time.Time {
	t.Helper()
	raw, ok := task["completedAt"].(string)
	if !ok {
		return nil
	}
	at, err := time.Parse(time.RFC3339Nano, raw)
	if err != nil {
		t.Fatalf("completedAt %q: %v", raw, err)
	}
	return &at
}

func TestGetTask(t *testing.T) {
	s := newTestServerAt(t, thailandNoon)
	owner := s.signedInOwner("owner@example.com")
	home := createCategory(t, owner, "Home")
	created := createTask(t, owner, map[string]any{"name": "ซักผ้า", "dueDate": "2026-11-20", "categoryId": home["id"]})

	res := owner.do(http.MethodGet, taskPath(created), nil)
	if res.Status != http.StatusOK {
		t.Fatalf("get: %d %v", res.Status, res.Body)
	}
	task := res.Body["task"].(map[string]any)
	if task["name"] != "ซักผ้า" || task["isOverdue"] != true {
		t.Errorf("task = %v", task)
	}
	if c, _ := task["category"].(map[string]any); c == nil || c["name"] != "Home" {
		t.Errorf("category = %v", task["category"])
	}
	for _, path := range []string{"/api/tasks/999999", "/api/tasks/abc", "/api/tasks/0"} {
		assertError(t, owner.do(http.MethodGet, path, nil), http.StatusNotFound, "not_found")
	}
}

func TestUpdateChangesEveryField(t *testing.T) {
	s := newTestServerAt(t, thailandNoon)
	owner := s.signedInOwner("owner@example.com")
	home := createCategory(t, owner, "Home")
	work := createCategory(t, owner, "Work")
	created := createTask(t, owner, map[string]any{
		"name": "ร่าง", "dueDate": "2026-11-25", "startDate": "2026-11-24", "startTime": "09:00", "endTime": "10:00",
		"priority": "low", "progress": 10, "note": "เดิม", "categoryId": home["id"],
	})

	task := updateTask(t, owner, created, map[string]any{
		"name": " รายงานฉบับจริง ", "dueDate": "2026-11-30", "startDate": "2026-11-28", "startTime": "13:00", "endTime": "08:30",
		"priority": "high", "progress": 60, "note": " ใหม่ ", "categoryId": work["id"],
	})
	want := map[string]any{
		"id": created["id"], "name": "รายงานฉบับจริง", "dueDate": "2026-11-30", "startDate": "2026-11-28",
		"startTime": "13:00", "endTime": "08:30", "priority": "high", "progress": float64(60),
		"status": "in_progress", "note": "ใหม่",
	}
	for key, value := range want {
		if task[key] != value {
			t.Errorf("%s = %#v, want %#v", key, task[key], value)
		}
	}
	if c, _ := task["category"].(map[string]any); c == nil || c["name"] != "Work" {
		t.Errorf("category = %v", task["category"])
	}
	if task["createdAt"] != created["createdAt"] {
		t.Errorf("createdAt changed: %v to %v", created["createdAt"], task["createdAt"])
	}

	// Optional fields left out are cleared; priority and progress return to their defaults.
	cleared := updateTask(t, owner, created, map[string]any{"name": "รายงาน", "dueDate": "2026-11-30", "categoryId": nil})
	for _, key := range []string{"startDate", "startTime", "endTime", "category", "completedAt"} {
		if cleared[key] != nil {
			t.Errorf("%s = %#v, want null", key, cleared[key])
		}
	}
	if cleared["note"] != "" || cleared["priority"] != "medium" || cleared["progress"] != float64(0) {
		t.Errorf("not reset: note %v, priority %v, progress %v", cleared["note"], cleared["priority"], cleared["progress"])
	}

	// A later read sees what the update saved.
	got := owner.do(http.MethodGet, taskPath(created), nil).Body["task"].(map[string]any)
	if got["name"] != "รายงาน" || got["startDate"] != nil {
		t.Errorf("read after update = %v", got)
	}
}

func TestUpdateAppliesTheCreateRules(t *testing.T) {
	s := newTestServer(t)
	owner := s.signedInOwner("owner@example.com")
	task := createTask(t, owner, map[string]any{"name": "งาน", "dueDate": "2026-11-25"})

	cases := []struct {
		body  map[string]any
		field string
		code  string
	}{
		{map[string]any{"name": " ", "dueDate": "2026-11-25"}, "name", "required"},
		{map[string]any{"name": "งาน", "dueDate": "2026-11-31"}, "dueDate", "invalid_date"},
		{map[string]any{"name": "งาน", "dueDate": "2026-11-25", "startDate": "2026-11-26"}, "startDate", "start_after_due"},
		{map[string]any{"name": "งาน", "dueDate": "2026-11-25", "startTime": "09:00"}, "endTime", "required"},
		{map[string]any{"name": "งาน", "dueDate": "2026-11-25", "startTime": "09:00", "endTime": "08:00"}, "endTime", "end_before_start"},
		{map[string]any{"name": "งาน", "dueDate": "2026-11-25", "priority": "urgent"}, "priority", "invalid_choice"},
		{map[string]any{"name": "งาน", "dueDate": "2026-11-25", "progress": 101}, "progress", "out_of_range"},
		{map[string]any{"name": "งาน", "dueDate": "2026-11-25", "categoryId": 999999}, "categoryId", "invalid_choice"},
	}
	for _, tc := range cases {
		assertValidation(t, owner.do(http.MethodPut, taskPath(task), tc.body), tc.field, tc.code)
	}
	assertError(t, owner.do(http.MethodPut, taskPath(task), "not an object"), http.StatusBadRequest, "bad_request")

	// A rejected update changes nothing.
	got := owner.do(http.MethodGet, taskPath(task), nil).Body["task"].(map[string]any)
	if got["name"] != "งาน" || got["dueDate"] != "2026-11-25" {
		t.Errorf("task after rejected updates = %v", got)
	}
}

func TestUpdateKeepsCompletedAtInStepWithProgress(t *testing.T) {
	clock := thailandNoon
	s := newTestServerWith(t, httpapi.Options{Now: func() time.Time { return clock }})
	owner := s.signedInOwner("owner@example.com")
	body := func(progress int) map[string]any {
		return map[string]any{"name": "งาน", "dueDate": "2026-11-25", "progress": progress}
	}
	task := createTask(t, owner, body(40))
	if task["completedAt"] != nil {
		t.Fatalf("completedAt = %v before done", task["completedAt"])
	}

	// Reaching 100 records the save time (D22).
	firstDone := clock.Add(time.Hour)
	clock = firstDone
	if at := completedAtOf(t, updateTask(t, owner, task, body(100))); at == nil || !at.Equal(firstDone) {
		t.Errorf("completedAt = %v, want %v", at, firstDone)
	}

	// Saving again at 100 keeps the first completion time.
	clock = clock.Add(time.Hour)
	if at := completedAtOf(t, updateTask(t, owner, task, body(100))); at == nil || !at.Equal(firstDone) {
		t.Errorf("completedAt after a second save = %v, want %v", at, firstDone)
	}

	// Dropping below 100 clears it, and the next completion records a new time.
	clock = clock.Add(time.Hour)
	reopened := updateTask(t, owner, task, body(90))
	if reopened["completedAt"] != nil || reopened["status"] != "in_progress" {
		t.Errorf("reopened: completedAt %v, status %v", reopened["completedAt"], reopened["status"])
	}
	clock = clock.Add(time.Hour)
	if at := completedAtOf(t, updateTask(t, owner, task, body(100))); at == nil || !at.Equal(clock) {
		t.Errorf("completedAt after reopening = %v, want %v", at, clock)
	}
}

func TestDeleteTaskIsPermanent(t *testing.T) {
	s := newTestServer(t)
	owner := s.signedInOwner("owner@example.com")
	task := createTask(t, owner, map[string]any{"name": "ลบฉัน", "dueDate": "2026-11-25"})
	kept := createTask(t, owner, map[string]any{"name": "เก็บไว้", "dueDate": "2026-11-25"})

	res := owner.do(http.MethodDelete, taskPath(task), nil)
	if res.Status != http.StatusNoContent {
		t.Fatalf("delete: %d %v", res.Status, res.Body)
	}
	assertError(t, owner.do(http.MethodGet, taskPath(task), nil), http.StatusNotFound, "not_found")
	assertError(t, owner.do(http.MethodDelete, taskPath(task), nil), http.StatusNotFound, "not_found")
	assertError(t, owner.do(http.MethodPut, taskPath(task), map[string]any{"name": "x", "dueDate": "2026-11-25"}), http.StatusNotFound, "not_found")

	recent := listRecent(t, owner, 10)
	if len(recent) != 1 || recent[0].(map[string]any)["id"] != kept["id"] {
		t.Errorf("recent after delete = %v", recent)
	}
}

func TestAnotherOwnersTaskIsNotFound(t *testing.T) {
	s := newTestServer(t)
	owner := s.signedInOwner("owner@example.com")
	other := s.signedInOwner("other@example.com")
	theirs := createTask(t, other, map[string]any{"name": "ของคนอื่น", "dueDate": "2026-11-25"})

	assertError(t, owner.do(http.MethodGet, taskPath(theirs), nil), http.StatusNotFound, "not_found")
	assertError(t, owner.do(http.MethodPut, taskPath(theirs), map[string]any{"name": "ยึด", "dueDate": "2026-11-25"}), http.StatusNotFound, "not_found")
	assertError(t, owner.do(http.MethodDelete, taskPath(theirs), nil), http.StatusNotFound, "not_found")

	got := other.do(http.MethodGet, taskPath(theirs), nil)
	if got.Status != http.StatusOK || got.Body["task"].(map[string]any)["name"] != "ของคนอื่น" {
		t.Errorf("other Owner's Task changed: %d %v", got.Status, got.Body)
	}

	// Without a session nothing is reachable.
	assertError(t, s.do(http.MethodGet, taskPath(theirs), nil), http.StatusUnauthorized, "unauthorized")
	assertError(t, s.do(http.MethodDelete, taskPath(theirs), nil), http.StatusUnauthorized, "unauthorized")
}
