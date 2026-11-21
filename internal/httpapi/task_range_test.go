package httpapi_test

import (
	"net/http"
	"slices"
	"strings"
	"testing"
)

func listRange(t *testing.T, c *client, from, to string) []string {
	t.Helper()
	res := c.do(http.MethodGet, "/api/tasks?from="+from+"&to="+to, nil)
	if res.Status != http.StatusOK {
		t.Fatalf("list %s to %s: %d %v", from, to, res.Status, res.Body)
	}
	names := []string{}
	for _, item := range res.Body["tasks"].([]any) {
		names = append(names, item.(map[string]any)["name"].(string))
	}
	return names
}

// The range is November 2026, both ends inclusive.
func TestListByRangeReturnsEveryOverlappingTask(t *testing.T) {
	s := newTestServerAt(t, thailandNoon)
	owner := s.signedInOwner("owner@example.com")

	for _, task := range []map[string]any{
		{"name": "before", "dueDate": "2026-10-31"},
		{"name": "first-day", "dueDate": "2026-11-01"},
		{"name": "inside", "dueDate": "2026-11-15"},
		{"name": "last-day", "dueDate": "2026-11-30"},
		{"name": "after", "dueDate": "2026-12-01"},
		{"name": "crosses-start", "startDate": "2026-10-28", "dueDate": "2026-11-02"},
		{"name": "crosses-end", "startDate": "2026-11-29", "dueDate": "2026-12-03"},
		{"name": "spans-whole", "startDate": "2026-10-01", "dueDate": "2026-12-31"},
		{"name": "ends-before", "startDate": "2026-10-01", "dueDate": "2026-10-31"},
		{"name": "starts-after", "startDate": "2026-12-01", "dueDate": "2026-12-05"},
	} {
		createTask(t, owner, task)
	}

	got := listRange(t, owner, "2026-11-01", "2026-11-30")
	want := []string{"crosses-start", "crosses-end", "spans-whole", "first-day", "inside", "last-day"}
	slices.Sort(got)
	slices.Sort(want)
	if !slices.Equal(got, want) {
		t.Errorf("tasks = %v, want %v", got, want)
	}

	// A one-day range finds a multi-day Task from the middle of it.
	if got := listRange(t, owner, "2026-11-10", "2026-11-10"); strings.Join(got, ",") != "spans-whole" {
		t.Errorf("one-day range = %v, want [spans-whole]", got)
	}
}

func TestListByRangeOrdersByFirstDayAndCarriesDerivedFields(t *testing.T) {
	s := newTestServerAt(t, thailandNoon) // today is 21 Nov 2026
	owner := s.signedInOwner("owner@example.com")
	createTask(t, owner, map[string]any{"name": "late", "dueDate": "2026-11-20", "startTime": "13:00", "endTime": "14:00"})
	createTask(t, owner, map[string]any{"name": "all-day", "dueDate": "2026-11-20"})
	createTask(t, owner, map[string]any{"name": "early", "startDate": "2026-11-18", "dueDate": "2026-11-20", "progress": 100})

	res := owner.do(http.MethodGet, "/api/tasks?from=2026-11-01&to=2026-11-30", nil)
	tasks := res.Body["tasks"].([]any)
	var names []string
	for _, item := range tasks {
		names = append(names, item.(map[string]any)["name"].(string))
	}
	if got := strings.Join(names, ","); got != "early,all-day,late" {
		t.Errorf("order = %s, want early,all-day,late", got)
	}
	for _, item := range tasks {
		task := item.(map[string]any)
		wantOverdue := task["name"] != "early" // done Tasks are never Overdue (D23)
		if task["isOverdue"] != wantOverdue {
			t.Errorf("%v: isOverdue = %v, want %v", task["name"], task["isOverdue"], wantOverdue)
		}
	}
}

func TestListByRangeIsOwnerScoped(t *testing.T) {
	s := newTestServer(t)
	owner := s.signedInOwner("owner@example.com")
	other := s.signedInOwner("other@example.com")
	createTask(t, other, map[string]any{"name": "theirs", "dueDate": "2026-11-15"})

	if got := listRange(t, owner, "2026-11-01", "2026-11-30"); len(got) != 0 {
		t.Errorf("Owner sees %v", got)
	}
}

func TestListByRangeNeedsAValidRange(t *testing.T) {
	s := newTestServer(t)
	owner := s.signedInOwner("owner@example.com")

	cases := []struct {
		query string
		field string
		code  string
	}{
		{"", "from", "required"},
		{"?to=2026-11-30", "from", "required"},
		{"?from=2026-11-01", "to", "required"},
		{"?from=2026-13-01&to=2026-11-30", "from", "invalid_date"},
		{"?from=2026-11-01&to=30/11/2569", "to", "invalid_date"},
		{"?from=2026-11-30&to=2026-11-01", "to", "out_of_range"},
		{"?from=2026-01-01&to=2027-02-06", "to", "out_of_range"},
	}
	for _, tc := range cases {
		assertValidation(t, owner.do(http.MethodGet, "/api/tasks"+tc.query, nil), tc.field, tc.code)
	}
	// 400 days is the longest range.
	listRange(t, owner, "2026-01-01", "2027-02-05")
}
