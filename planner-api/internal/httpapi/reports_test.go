package httpapi_test

import (
	"fmt"
	"net/http"
	"strings"
	"testing"
	"time"

	"planner-api/internal/httpapi"
)

// thaiTime is a wall-clock time in Thailand.
func thaiTime(year int, month time.Month, day, hour, minute int) time.Time {
	return time.Date(year, month, day, hour-7, minute, 0, 0, time.UTC)
}

func getReport(t *testing.T, c *client, from, to string) map[string]any {
	t.Helper()
	res := c.do(http.MethodGet, "/api/reports?from="+from+"&to="+to, nil)
	if res.Status != http.StatusOK {
		t.Fatalf("report %s to %s: %d %v", from, to, res.Status, res.Body)
	}
	return res.Body["report"].(map[string]any)
}

// All six metrics over one data set with known answers (D31, T2). Today is
// Saturday 21 Nov 2026 and the range is November 2026.
func TestReportsAgainstAKnownDataSet(t *testing.T) {
	clock := thailandNoon
	s := newTestServerWith(t, httpapi.Options{Now: func() time.Time { return clock }})
	owner := s.signedInOwner("owner@example.com")
	work := createCategory(t, owner, "งาน")["id"]
	home := createCategory(t, owner, "บ้าน")["id"]

	// createAt saves a Task with the API clock at `at`, so a done Task is completed then.
	createAt := func(at time.Time, task map[string]any) {
		clock = at
		createTask(t, owner, task)
		clock = thailandNoon
	}
	createAt(thaiTime(2026, 11, 4, 10, 0), map[string]any{"name": "A on time", "dueDate": "2026-11-05", "categoryId": work, "priority": "high", "progress": 100})
	createAt(thaiTime(2026, 11, 7, 9, 0), map[string]any{"name": "B late", "dueDate": "2026-11-05", "categoryId": work, "progress": 100})
	// 23:30 in Thailand is still the due date, although UTC has it the same day too.
	createAt(thaiTime(2026, 11, 10, 23, 30), map[string]any{"name": "C on the day", "dueDate": "2026-11-10", "categoryId": home, "priority": "low", "progress": 100})
	// 00:30 on Monday 16 Nov in Thailand is Sunday 15 Nov in UTC: it belongs to the week of the 16th.
	createAt(thaiTime(2026, 11, 16, 0, 30), map[string]any{"name": "D early", "dueDate": "2026-11-20", "progress": 100})
	createTask(t, owner, map[string]any{"name": "E overdue", "dueDate": "2026-11-15", "categoryId": work, "priority": "high", "progress": 50})
	createTask(t, owner, map[string]any{"name": "F ahead", "dueDate": "2026-11-25", "categoryId": home, "priority": "low"})
	createTask(t, owner, map[string]any{"name": "G due today", "dueDate": "2026-11-21"})
	// Due outside the range: only its completion inside the range counts.
	createAt(thaiTime(2026, 11, 20, 8, 0), map[string]any{"name": "H due December", "dueDate": "2026-12-02", "progress": 100})
	// Completed before the range: not counted anywhere.
	createAt(thaiTime(2026, 10, 31, 20, 0), map[string]any{"name": "I October", "dueDate": "2026-10-30", "progress": 100})

	saveChecklist(t, owner, "2026-10-31", map[string]any{"glasses": 10, "breakfastDone": true, "lunchDone": true, "dinnerDone": true})
	saveChecklist(t, owner, "2026-11-01", map[string]any{"glasses": 8, "breakfastDone": true, "lunchDone": true, "dinnerDone": true})
	saveChecklist(t, owner, "2026-11-10", map[string]any{"glasses": 4, "breakfastDone": true, "lunchDone": true})
	saveChecklist(t, owner, "2026-11-21", map[string]any{"glasses": 9, "breakfastDone": true, "lunchDone": true, "dinnerDone": true})
	// After today: not counted, though inside the range.
	saveChecklist(t, owner, "2026-11-25", map[string]any{"glasses": 10, "breakfastDone": true, "lunchDone": true, "dinnerDone": true})

	report := getReport(t, owner, "2026-11-01", "2026-11-30")

	if report["from"] != "2026-11-01" || report["to"] != "2026-11-30" || report["total"] != float64(7) {
		t.Errorf("from, to, total = %v, %v, %v", report["from"], report["to"], report["total"])
	}

	// Story 49: every Monday-start week touching November, zeros included.
	var weeks []string
	for _, item := range report["completedPerWeek"].([]any) {
		week := item.(map[string]any)
		weeks = append(weeks, fmt.Sprintf("%s=%v", week["weekStart"], week["count"]))
	}
	if want := "2026-10-26=0,2026-11-02=2,2026-11-09=1,2026-11-16=2,2026-11-23=0,2026-11-30=0"; strings.Join(weeks, ",") != want {
		t.Errorf("completedPerWeek = %v, want %s", weeks, want)
	}

	// Story 50: settled Tasks only; F (ahead) and G (due today) are not settled.
	onTime := report["onTime"].(map[string]any)
	if onTime["onTime"] != float64(3) || onTime["late"] != float64(1) || onTime["notDone"] != float64(1) || onTime["share"] != 0.6 {
		t.Errorf("onTime = %v, want 3 on time, 1 late, 1 not done, share 0.6", onTime)
	}

	// Story 51.
	byPriority := report["byPriority"].(map[string]any)
	if byPriority["high"] != float64(2) || byPriority["medium"] != float64(3) || byPriority["low"] != float64(2) {
		t.Errorf("byPriority = %v", byPriority)
	}
	var categories []string
	for _, item := range report["byCategory"].([]any) {
		entry := item.(map[string]any)
		name := "(none)"
		if category, ok := entry["category"].(map[string]any); ok {
			name = category["name"].(string)
		}
		categories = append(categories, fmt.Sprintf("%s=%v", name, entry["count"]))
	}
	if want := "งาน=3,บ้าน=2,(none)=2"; strings.Join(categories, ",") != want {
		t.Errorf("byCategory = %v, want %s", categories, want)
	}

	// Story 52.
	if report["overdue"] != float64(1) {
		t.Errorf("overdue = %v, want 1", report["overdue"])
	}

	// Story 53: 1 to 21 November, days without a record counting as 0.
	water := report["water"].(map[string]any)
	if water["days"] != float64(21) || water["averageGlasses"] != 1.0 {
		t.Errorf("water = %v, want 21 days at 1 glass", water)
	}
	if report["allMealsDays"] != float64(2) {
		t.Errorf("allMealsDays = %v, want 2", report["allMealsDays"])
	}
}

// A range wholly after today has nothing settled and no days to average.
func TestReportsForAFutureRange(t *testing.T) {
	s := newTestServerAt(t, thailandNoon)
	owner := s.signedInOwner("owner@example.com")
	createTask(t, owner, map[string]any{"name": "next month", "dueDate": "2026-12-10"})

	report := getReport(t, owner, "2026-12-01", "2026-12-31")
	if report["total"] != float64(1) || report["overdue"] != float64(0) {
		t.Errorf("total, overdue = %v, %v", report["total"], report["overdue"])
	}
	if share := report["onTime"].(map[string]any)["share"]; share != nil {
		t.Errorf("share = %v, want null", share)
	}
	water := report["water"].(map[string]any)
	if water["averageGlasses"] != nil || water["days"] != float64(0) || report["allMealsDays"] != float64(0) {
		t.Errorf("water = %v, allMealsDays = %v", water, report["allMealsDays"])
	}
	if weeks := report["completedPerWeek"].([]any); len(weeks) != 5 {
		t.Errorf("December 2026 touches %d weeks, want 5", len(weeks))
	}
	if categories := report["byCategory"].([]any); len(categories) != 1 || categories[0].(map[string]any)["category"] != nil {
		t.Errorf("byCategory = %v, want one uncategorised entry", categories)
	}
}

func TestReportsNeedAValidRange(t *testing.T) {
	s := newTestServer(t)
	owner := s.signedInOwner("owner@example.com")
	cases := []struct {
		query string
		field string
		code  string
	}{
		{"", "from", "required"},
		{"?from=2026-11-01", "to", "required"},
		{"?from=2026-02-30&to=2026-03-01", "from", "invalid_date"},
		{"?from=2026-11-30&to=2026-11-01", "to", "out_of_range"},
		{"?from=2026-01-01&to=2027-02-06", "to", "out_of_range"},
	}
	for _, tc := range cases {
		assertValidation(t, owner.do(http.MethodGet, "/api/reports"+tc.query, nil), tc.field, tc.code)
	}
}

func TestReportsAreOwnerScoped(t *testing.T) {
	s := newTestServerAt(t, thailandNoon)
	owner := s.signedInOwner("owner@example.com")
	other := s.signedInOwner("other@example.com")
	createTask(t, other, map[string]any{"name": "theirs", "dueDate": "2026-11-05", "progress": 100})
	saveChecklist(t, other, "2026-11-05", map[string]any{"glasses": 12, "breakfastDone": true, "lunchDone": true, "dinnerDone": true})

	report := getReport(t, owner, "2026-11-01", "2026-11-30")
	water := report["water"].(map[string]any)
	if report["total"] != float64(0) || report["allMealsDays"] != float64(0) || water["averageGlasses"] != 0.0 {
		t.Errorf("Owner sees another Owner's data: %v", report)
	}
	for _, item := range report["completedPerWeek"].([]any) {
		if count := item.(map[string]any)["count"]; count != float64(0) {
			t.Errorf("completedPerWeek has %v", count)
		}
	}
}

func TestReportsNeedASession(t *testing.T) {
	s := newTestServer(t)
	assertError(t, s.do(http.MethodGet, "/api/reports?from=2026-11-01&to=2026-11-30", nil), http.StatusUnauthorized, "unauthorized")
}
