package httpapi_test

import (
	"fmt"
	"net/http"
	"strings"
	"testing"
	"time"
)

func getOverview(t *testing.T, c *client) map[string]any {
	t.Helper()
	res := c.do(http.MethodGet, "/api/overview", nil)
	if res.Status != http.StatusOK {
		t.Fatalf("overview: %d %v", res.Status, res.Body)
	}
	return res.Body
}

func taskNames(items any) []string {
	names := []string{}
	for _, item := range items.([]any) {
		names = append(names, item.(map[string]any)["name"].(string))
	}
	return names
}

// Today's Tasks are those whose span covers today (D30, story 36).
func TestOverviewListsTodaysTasks(t *testing.T) {
	s := newTestServerAt(t, thailandNoon) // today is 21 Nov 2026
	owner := s.signedInOwner("owner@example.com")

	createTask(t, owner, map[string]any{"name": "due-today-timed", "dueDate": "2026-11-21", "startTime": "09:00", "endTime": "10:00"})
	createTask(t, owner, map[string]any{"name": "due-today", "dueDate": "2026-11-21"})
	createTask(t, owner, map[string]any{"name": "covers-today", "startDate": "2026-11-19", "dueDate": "2026-11-24"})
	createTask(t, owner, map[string]any{"name": "done-today", "dueDate": "2026-11-21", "progress": 100})
	createTask(t, owner, map[string]any{"name": "starts-tomorrow", "startDate": "2026-11-22", "dueDate": "2026-11-25"})
	createTask(t, owner, map[string]any{"name": "due-yesterday", "dueDate": "2026-11-20"})

	body := getOverview(t, owner)
	if body["today"] != "2026-11-21" {
		t.Errorf("today = %v, want 2026-11-21", body["today"])
	}
	got := taskNames(body["todayTasks"])

	// Ordered as listing by date range: first day, untimed before timed, then start time.
	want := "covers-today,due-today,done-today,due-today-timed"
	if strings.Join(got, ",") != want {
		t.Errorf("todayTasks = %v, want %s", got, want)
	}
	for _, item := range body["todayTasks"].([]any) {
		task := item.(map[string]any)
		if task["isOverdue"] != false {
			t.Errorf("%v is overdue; a Task due today is not (A5)", task["name"])
		}
		if task["name"] == "done-today" && task["status"] != "done" {
			t.Errorf("done-today status = %v", task["status"])
		}
	}
}

// Today follows the Thailand date, not UTC (D9).
func TestOverviewTodayIsTheThailandDate(t *testing.T) {
	// 22 Nov 2026 00:30 in Thailand is still 21 Nov in UTC.
	s := newTestServerAt(t, time.Date(2026, 11, 21, 17, 30, 0, 0, time.UTC))
	owner := s.signedInOwner("owner@example.com")
	createTask(t, owner, map[string]any{"name": "21st", "dueDate": "2026-11-21"})
	createTask(t, owner, map[string]any{"name": "22nd", "dueDate": "2026-11-22"})

	body := getOverview(t, owner)
	if body["today"] != "2026-11-22" {
		t.Errorf("today = %v, want 2026-11-22", body["today"])
	}
	if got := taskNames(body["todayTasks"]); strings.Join(got, ",") != "22nd" {
		t.Errorf("todayTasks = %v, want [22nd]", got)
	}
}

func TestOverviewIsEmptyWithNoTasks(t *testing.T) {
	s := newTestServerAt(t, thailandNoon)
	owner := s.signedInOwner("owner@example.com")

	if got := taskNames(getOverview(t, owner)["todayTasks"]); len(got) != 0 {
		t.Errorf("todayTasks = %v, want an empty list", got)
	}
}

func TestOverviewIsOwnerScoped(t *testing.T) {
	s := newTestServerAt(t, thailandNoon)
	owner := s.signedInOwner("owner@example.com")
	other := s.signedInOwner("other@example.com")
	createTask(t, other, map[string]any{"name": "theirs", "dueDate": "2026-11-21"})

	if got := taskNames(getOverview(t, owner)["todayTasks"]); len(got) != 0 {
		t.Errorf("Owner sees %v", got)
	}
}

func TestOverviewNeedsASession(t *testing.T) {
	s := newTestServer(t)
	assertError(t, s.do(http.MethodGet, "/api/overview", nil), http.StatusUnauthorized, "unauthorized")
}

// Every Overdue Task, however old, oldest due date first (D23, story 37).
func TestOverviewListsEveryOverdueTask(t *testing.T) {
	s := newTestServerAt(t, thailandNoon) // today is 21 Nov 2026
	owner := s.signedInOwner("owner@example.com")

	createTask(t, owner, map[string]any{"name": "b-yesterday", "dueDate": "2026-11-20"})
	createTask(t, owner, map[string]any{"name": "a-yesterday", "dueDate": "2026-11-20", "progress": 60})
	createTask(t, owner, map[string]any{"name": "last-year", "dueDate": "2025-01-05"})
	createTask(t, owner, map[string]any{"name": "multi-day-ended", "startDate": "2026-11-01", "dueDate": "2026-11-10"})
	createTask(t, owner, map[string]any{"name": "due-today", "dueDate": "2026-11-21"})
	createTask(t, owner, map[string]any{"name": "done-late", "dueDate": "2026-11-01", "progress": 100})
	createTask(t, owner, map[string]any{"name": "future", "dueDate": "2026-12-01"})

	body := getOverview(t, owner)
	got := taskNames(body["overdueTasks"])
	want := "last-year,multi-day-ended,a-yesterday,b-yesterday"
	if strings.Join(got, ",") != want {
		t.Errorf("overdueTasks = %v, want %s", got, want)
	}
	for _, item := range body["overdueTasks"].([]any) {
		if task := item.(map[string]any); task["isOverdue"] != true {
			t.Errorf("%v: isOverdue = %v", task["name"], task["isOverdue"])
		}
	}
}

// Dropping a done Task back below 100 makes it Overdue again (D21, D23).
func TestOverviewOverdueFollowsProgress(t *testing.T) {
	s := newTestServerAt(t, thailandNoon)
	owner := s.signedInOwner("owner@example.com")
	task := createTask(t, owner, map[string]any{"name": "late", "dueDate": "2026-11-15", "progress": 100})

	if got := taskNames(getOverview(t, owner)["overdueTasks"]); len(got) != 0 {
		t.Fatalf("a done Task is overdue: %v", got)
	}
	path := fmt.Sprintf("/api/tasks/%v", task["id"])
	if res := owner.do(http.MethodPut, path, map[string]any{"name": "late", "dueDate": "2026-11-15", "progress": 50}); res.Status != http.StatusOK {
		t.Fatalf("update: %d %v", res.Status, res.Body)
	}
	if got := taskNames(getOverview(t, owner)["overdueTasks"]); strings.Join(got, ",") != "late" {
		t.Errorf("overdueTasks = %v, want [late]", got)
	}
}

func TestOverviewOverdueIsOwnerScoped(t *testing.T) {
	s := newTestServerAt(t, thailandNoon)
	owner := s.signedInOwner("owner@example.com")
	other := s.signedInOwner("other@example.com")
	createTask(t, other, map[string]any{"name": "theirs", "dueDate": "2026-11-01"})

	if got := taskNames(getOverview(t, owner)["overdueTasks"]); len(got) != 0 {
		t.Errorf("Owner sees %v", got)
	}
}

func monthOf(t *testing.T, body map[string]any) map[string]any {
	t.Helper()
	month, ok := body["month"].(map[string]any)
	if !ok {
		t.Fatalf("month missing: %v", body)
	}
	return month
}

func assertCounts(t *testing.T, month map[string]any, want map[string]float64) {
	t.Helper()
	for key, n := range want {
		if month[key] != n {
			t.Errorf("month.%s = %v, want %v", key, month[key], n)
		}
	}
}

// This month's summary counts the Tasks due in the month (D30, story 38).
func TestOverviewSummarisesThisMonth(t *testing.T) {
	s := newTestServerAt(t, thailandNoon) // today is 21 Nov 2026
	owner := s.signedInOwner("owner@example.com")

	createTask(t, owner, map[string]any{"name": "first-day-overdue", "dueDate": "2026-11-01"})
	createTask(t, owner, map[string]any{"name": "overdue-in-progress", "dueDate": "2026-11-20", "progress": 30})
	createTask(t, owner, map[string]any{"name": "done-late", "dueDate": "2026-11-05", "progress": 100})
	createTask(t, owner, map[string]any{"name": "due-today", "dueDate": "2026-11-21", "progress": 50})
	createTask(t, owner, map[string]any{"name": "last-day", "dueDate": "2026-11-30"})
	createTask(t, owner, map[string]any{"name": "done-ahead", "dueDate": "2026-11-28", "progress": 100})
	// Started last month, due this month: counts.
	createTask(t, owner, map[string]any{"name": "started-october", "startDate": "2026-10-20", "dueDate": "2026-11-03", "progress": 10})
	// Outside the month: do not count, even when they touch it.
	createTask(t, owner, map[string]any{"name": "day-before", "dueDate": "2026-10-31"})
	createTask(t, owner, map[string]any{"name": "day-after", "dueDate": "2026-12-01"})
	createTask(t, owner, map[string]any{"name": "starts-this-month", "startDate": "2026-11-25", "dueDate": "2026-12-05"})

	month := monthOf(t, getOverview(t, owner))
	if month["month"] != "2026-11" {
		t.Errorf("month.month = %v, want 2026-11", month["month"])
	}
	assertCounts(t, month, map[string]float64{"total": 7, "done": 2, "inProgress": 3, "overdue": 3})
}

// The month turns over at midnight in Thailand, not in UTC (D9).
func TestOverviewMonthTurnsOverInThailand(t *testing.T) {
	// 1 Dec 2026 00:30 in Thailand is still 30 Nov in UTC.
	s := newTestServerAt(t, time.Date(2026, 11, 30, 17, 30, 0, 0, time.UTC))
	owner := s.signedInOwner("owner@example.com")
	createTask(t, owner, map[string]any{"name": "november", "dueDate": "2026-11-30"})
	createTask(t, owner, map[string]any{"name": "december", "dueDate": "2026-12-01"})

	month := monthOf(t, getOverview(t, owner))
	if month["month"] != "2026-12" {
		t.Errorf("month.month = %v, want 2026-12", month["month"])
	}
	assertCounts(t, month, map[string]float64{"total": 1, "done": 0, "inProgress": 0, "overdue": 0})
}

func TestOverviewMonthIsZeroWithNoTasks(t *testing.T) {
	s := newTestServerAt(t, thailandNoon)
	owner := s.signedInOwner("owner@example.com")
	other := s.signedInOwner("other@example.com")
	createTask(t, other, map[string]any{"name": "theirs", "dueDate": "2026-11-10"})

	assertCounts(t, monthOf(t, getOverview(t, owner)), map[string]float64{"total": 0, "done": 0, "inProgress": 0, "overdue": 0})
}

// Charts: this month's Tasks by Status and by Category (D30, story 39).
func TestOverviewCountsThisMonthByStatusAndCategory(t *testing.T) {
	s := newTestServerAt(t, thailandNoon) // today is 21 Nov 2026
	owner := s.signedInOwner("owner@example.com")
	work := createCategory(t, owner, "งาน")["id"]
	home := createCategory(t, owner, "บ้าน")["id"]
	study := createCategory(t, owner, "เรียน")["id"]
	createCategory(t, owner, "ว่าง") // no Tasks at all

	createTask(t, owner, map[string]any{"name": "w1", "dueDate": "2026-11-02", "categoryId": work})
	createTask(t, owner, map[string]any{"name": "w2", "dueDate": "2026-11-12", "categoryId": work, "progress": 50})
	createTask(t, owner, map[string]any{"name": "w3", "dueDate": "2026-11-30", "categoryId": work, "progress": 100})
	createTask(t, owner, map[string]any{"name": "h1", "dueDate": "2026-11-21", "categoryId": home, "progress": 100})
	createTask(t, owner, map[string]any{"name": "u1", "dueDate": "2026-11-25"})
	// Only in other months: its Category does not appear.
	createTask(t, owner, map[string]any{"name": "s1", "dueDate": "2026-12-02", "categoryId": study})

	month := monthOf(t, getOverview(t, owner))
	byStatus, ok := month["byStatus"].(map[string]any)
	if !ok {
		t.Fatalf("byStatus missing: %v", month)
	}
	for status, n := range map[string]float64{"not_started": 2, "in_progress": 1, "done": 2} {
		if byStatus[status] != n {
			t.Errorf("byStatus.%s = %v, want %v", status, byStatus[status], n)
		}
	}
	sum := byStatus["not_started"].(float64) + byStatus["in_progress"].(float64) + byStatus["done"].(float64)
	if sum != month["total"] {
		t.Errorf("byStatus adds up to %v, total is %v", sum, month["total"])
	}

	var got []string
	for _, item := range month["byCategory"].([]any) {
		entry := item.(map[string]any)
		name := "(none)"
		if category, ok := entry["category"].(map[string]any); ok {
			name = category["name"].(string)
		} else if entry["category"] != nil {
			t.Errorf("category = %v, want an object or null", entry["category"])
		}
		got = append(got, fmt.Sprintf("%s=%v", name, entry["count"]))
	}
	if want := "งาน=3,บ้าน=1,(none)=1"; strings.Join(got, ",") != want {
		t.Errorf("byCategory = %v, want %s", got, want)
	}
}

func TestOverviewChartsAreEmptyWithNoTasks(t *testing.T) {
	s := newTestServerAt(t, thailandNoon)
	owner := s.signedInOwner("owner@example.com")
	other := s.signedInOwner("other@example.com")
	theirs := createCategory(t, other, "ของเขา")["id"]
	createTask(t, other, map[string]any{"name": "theirs", "dueDate": "2026-11-10", "categoryId": theirs})

	month := monthOf(t, getOverview(t, owner))
	byStatus := month["byStatus"].(map[string]any)
	for _, status := range []string{"not_started", "in_progress", "done"} {
		if byStatus[status] != float64(0) {
			t.Errorf("byStatus.%s = %v, want 0", status, byStatus[status])
		}
	}
	if categories := month["byCategory"].([]any); len(categories) != 0 {
		t.Errorf("byCategory = %v, want an empty list", categories)
	}
}
