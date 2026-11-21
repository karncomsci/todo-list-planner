package httpapi_test

import (
	"net/http"
	"strings"
	"testing"
)

func getChecklist(t *testing.T, c *client, date string) map[string]any {
	t.Helper()
	res := c.do(http.MethodGet, "/api/checklists/"+date, nil)
	if res.Status != http.StatusOK {
		t.Fatalf("checklist %s: %d %v", date, res.Status, res.Body)
	}
	return res.Body["checklist"].(map[string]any)
}

func saveChecklist(t *testing.T, c *client, date string, body map[string]any) map[string]any {
	t.Helper()
	res := c.do(http.MethodPut, "/api/checklists/"+date, body)
	if res.Status != http.StatusOK {
		t.Fatalf("save checklist %s: %d %v", date, res.Status, res.Body)
	}
	return res.Body["checklist"].(map[string]any)
}

func assertEmptyChecklist(t *testing.T, checklist map[string]any, date string) {
	t.Helper()
	want := map[string]any{
		"date": date, "glasses": float64(0), "note": "",
		"breakfastMenu": "", "breakfastDone": false,
		"lunchMenu": "", "lunchDone": false,
		"dinnerMenu": "", "dinnerDone": false,
	}
	for key, value := range want {
		if checklist[key] != value {
			t.Errorf("%s: %s = %v, want %v", date, key, checklist[key], value)
		}
	}
}

// A day with no record is an empty checklist (D27, story 46).
func TestChecklistOfAnUnsavedDayIsEmpty(t *testing.T) {
	s := newTestServer(t)
	owner := s.signedInOwner("owner@example.com")
	assertEmptyChecklist(t, getChecklist(t, owner, "2026-11-22"), "2026-11-22")
}

// Days are separate, and past days are kept (D27, story 47).
func TestChecklistsAreSeparatePerDay(t *testing.T) {
	s := newTestServer(t)
	owner := s.signedInOwner("owner@example.com")

	saved := saveChecklist(t, owner, "2026-11-21", map[string]any{
		"glasses": 5, "breakfastMenu": "  ข้าวต้ม ", "breakfastDone": true,
		"lunchMenu": "ผัดกะเพรา", "lunchDone": true, "dinnerMenu": "", "dinnerDone": false,
		"note": "ดื่มน้ำให้ครบ",
	})
	if saved["breakfastMenu"] != "ข้าวต้ม" || saved["glasses"] != float64(5) || saved["date"] != "2026-11-21" {
		t.Errorf("saved = %v", saved)
	}

	assertEmptyChecklist(t, getChecklist(t, owner, "2026-11-22"), "2026-11-22")
	got := getChecklist(t, owner, "2026-11-21")
	if got["lunchMenu"] != "ผัดกะเพรา" || got["lunchDone"] != true || got["note"] != "ดื่มน้ำให้ครบ" {
		t.Errorf("kept = %v", got)
	}
}

// Saving replaces every field of the day.
func TestSaveChecklistReplacesTheDay(t *testing.T) {
	s := newTestServer(t)
	owner := s.signedInOwner("owner@example.com")
	saveChecklist(t, owner, "2026-11-21", map[string]any{"glasses": 3, "dinnerMenu": "ส้มตำ", "dinnerDone": true})
	saveChecklist(t, owner, "2026-11-21", map[string]any{"glasses": 4})

	got := getChecklist(t, owner, "2026-11-21")
	if got["glasses"] != float64(4) || got["dinnerMenu"] != "" || got["dinnerDone"] != false {
		t.Errorf("after replace = %v", got)
	}
}

func TestSaveChecklistValidates(t *testing.T) {
	s := newTestServer(t)
	owner := s.signedInOwner("owner@example.com")

	cases := []struct {
		body  map[string]any
		field string
		code  string
	}{
		{map[string]any{"glasses": -1}, "glasses", "out_of_range"},
		{map[string]any{"glasses": 31}, "glasses", "out_of_range"},
		{map[string]any{"breakfastMenu": strings.Repeat("ก", 101)}, "breakfastMenu", "too_long"},
		{map[string]any{"lunchMenu": strings.Repeat("ก", 101)}, "lunchMenu", "too_long"},
		{map[string]any{"dinnerMenu": strings.Repeat("ก", 101)}, "dinnerMenu", "too_long"},
		{map[string]any{"note": strings.Repeat("ก", 1001)}, "note", "too_long"},
	}
	for _, tc := range cases {
		assertValidation(t, owner.do(http.MethodPut, "/api/checklists/2026-11-21", tc.body), tc.field, tc.code)
	}
	assertValidation(t, owner.do(http.MethodGet, "/api/checklists/2026-13-01", nil), "date", "invalid_date")
	assertValidation(t, owner.do(http.MethodPut, "/api/checklists/22-11-2569", map[string]any{}), "date", "invalid_date")

	// The longest values are accepted.
	saveChecklist(t, owner, "2026-11-21", map[string]any{
		"glasses": 30, "breakfastMenu": strings.Repeat("ก", 100), "note": strings.Repeat("ก", 1000),
	})
}

func TestChecklistIsOwnerScoped(t *testing.T) {
	s := newTestServer(t)
	owner := s.signedInOwner("owner@example.com")
	other := s.signedInOwner("other@example.com")
	saveChecklist(t, other, "2026-11-21", map[string]any{"glasses": 6, "note": "ของเขา"})

	assertEmptyChecklist(t, getChecklist(t, owner, "2026-11-21"), "2026-11-21")
}

// The Water Goal is 8 until changed (D28, A4).
func TestSettingsDefaultWaterGoal(t *testing.T) {
	s := newTestServer(t)
	owner := s.signedInOwner("owner@example.com")
	res := owner.do(http.MethodGet, "/api/settings", nil)
	if res.Status != http.StatusOK {
		t.Fatalf("settings: %d %v", res.Status, res.Body)
	}
	if goal := res.Body["settings"].(map[string]any)["waterGoal"]; goal != float64(8) {
		t.Errorf("waterGoal = %v, want 8", goal)
	}
}

func TestChecklistAndSettingsNeedASession(t *testing.T) {
	s := newTestServer(t)
	assertError(t, s.do(http.MethodGet, "/api/checklists/2026-11-21", nil), http.StatusUnauthorized, "unauthorized")
	assertError(t, s.do(http.MethodPut, "/api/checklists/2026-11-21", map[string]any{}), http.StatusUnauthorized, "unauthorized")
	assertError(t, s.do(http.MethodGet, "/api/settings", nil), http.StatusUnauthorized, "unauthorized")
}
