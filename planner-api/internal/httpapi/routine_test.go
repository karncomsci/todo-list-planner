package httpapi_test

import (
	"net/http"
	"strings"
	"testing"
)

func getRoutine(t *testing.T, c *client) map[float64]string {
	t.Helper()
	res := c.do(http.MethodGet, "/api/routine", nil)
	if res.Status != http.StatusOK {
		t.Fatalf("routine: %d %v", res.Status, res.Body)
	}
	return routineEntries(t, res.Body)
}

func routineEntries(t *testing.T, body map[string]any) map[float64]string {
	t.Helper()
	entries := body["entries"].([]any)
	if len(entries) != 19 {
		t.Fatalf("routine has %d hours, want 19 (05:00 to 23:00)", len(entries))
	}
	got := map[float64]string{}
	for i, item := range entries {
		entry := item.(map[string]any)
		if entry["hour"] != float64(5+i) {
			t.Fatalf("entry %d is hour %v, want %d", i, entry["hour"], 5+i)
		}
		got[entry["hour"].(float64)] = entry["text"].(string)
	}
	return got
}

func TestRoutineStartsWithNineteenEmptyHours(t *testing.T) {
	s := newTestServer(t)
	owner := s.signedInOwner("owner@example.com")
	for hour, text := range getRoutine(t, owner) {
		if text != "" {
			t.Errorf("hour %v = %q, want empty", hour, text)
		}
	}
}

// The Routine is one template, replaced whole on save (D26, stories 40, 41).
func TestSaveRoutineReplacesTheTemplate(t *testing.T) {
	s := newTestServer(t)
	owner := s.signedInOwner("owner@example.com")

	res := owner.do(http.MethodPut, "/api/routine", map[string]any{"entries": []map[string]any{
		{"hour": 5, "text": "  ตื่นนอน  "},
		{"hour": 12, "text": "กินข้าว"},
		{"hour": 23, "text": "นอน"},
		{"hour": 13, "text": "   "},
	}})
	if res.Status != http.StatusOK {
		t.Fatalf("save: %d %v", res.Status, res.Body)
	}
	saved := routineEntries(t, res.Body)
	if saved[5] != "ตื่นนอน" || saved[12] != "กินข้าว" || saved[23] != "นอน" || saved[13] != "" {
		t.Errorf("saved = %v", saved)
	}

	// Saving again with fewer hours empties the rest.
	owner.do(http.MethodPut, "/api/routine", map[string]any{"entries": []map[string]any{{"hour": 7, "text": "วิ่ง"}}})
	got := getRoutine(t, owner)
	if got[7] != "วิ่ง" || got[5] != "" || got[12] != "" {
		t.Errorf("after replace = %v", got)
	}
}

func TestClearRoutine(t *testing.T) {
	s := newTestServer(t)
	owner := s.signedInOwner("owner@example.com")
	owner.do(http.MethodPut, "/api/routine", map[string]any{"entries": []map[string]any{{"hour": 8, "text": "ทำงาน"}}})

	if res := owner.do(http.MethodDelete, "/api/routine", nil); res.Status != http.StatusNoContent {
		t.Fatalf("clear: %d %v", res.Status, res.Body)
	}
	for hour, text := range getRoutine(t, owner) {
		if text != "" {
			t.Errorf("hour %v = %q after clear", hour, text)
		}
	}
}

func TestSaveRoutineValidates(t *testing.T) {
	s := newTestServer(t)
	owner := s.signedInOwner("owner@example.com")
	owner.do(http.MethodPut, "/api/routine", map[string]any{"entries": []map[string]any{{"hour": 9, "text": "เดิม"}}})

	cases := []struct {
		entries []map[string]any
		code    string
	}{
		{[]map[string]any{{"hour": 4, "text": "x"}}, "out_of_range"},
		{[]map[string]any{{"hour": 24, "text": "x"}}, "out_of_range"},
		{[]map[string]any{{"hour": 6, "text": "a"}, {"hour": 6, "text": "b"}}, "out_of_range"},
		{[]map[string]any{{"hour": 6, "text": strings.Repeat("ก", 201)}}, "too_long"},
	}
	for _, tc := range cases {
		assertValidation(t, owner.do(http.MethodPut, "/api/routine", map[string]any{"entries": tc.entries}), "entries", tc.code)
	}
	// A rejected save changes nothing.
	if got := getRoutine(t, owner); got[9] != "เดิม" {
		t.Errorf("hour 9 = %q after rejected saves", got[9])
	}
	// 200 characters is the longest entry.
	res := owner.do(http.MethodPut, "/api/routine", map[string]any{"entries": []map[string]any{{"hour": 6, "text": strings.Repeat("ก", 200)}}})
	if res.Status != http.StatusOK {
		t.Errorf("200 characters: %d %v", res.Status, res.Body)
	}
}

func TestRoutineIsOwnerScoped(t *testing.T) {
	s := newTestServer(t)
	owner := s.signedInOwner("owner@example.com")
	other := s.signedInOwner("other@example.com")
	other.do(http.MethodPut, "/api/routine", map[string]any{"entries": []map[string]any{{"hour": 10, "text": "ของเขา"}}})

	if got := getRoutine(t, owner); got[10] != "" {
		t.Errorf("Owner sees %q", got[10])
	}
	owner.do(http.MethodDelete, "/api/routine", nil)
	if got := getRoutine(t, other); got[10] != "ของเขา" {
		t.Errorf("clearing one Owner's Routine cleared the other's: %q", got[10])
	}
}

func TestRoutineNeedsASession(t *testing.T) {
	s := newTestServer(t)
	assertError(t, s.do(http.MethodGet, "/api/routine", nil), http.StatusUnauthorized, "unauthorized")
	assertError(t, s.do(http.MethodPut, "/api/routine", map[string]any{"entries": []any{}}), http.StatusUnauthorized, "unauthorized")
	assertError(t, s.do(http.MethodDelete, "/api/routine", nil), http.StatusUnauthorized, "unauthorized")
}
