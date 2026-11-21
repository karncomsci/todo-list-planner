package httpapi_test

import (
	"encoding/json"
	"net/http"
	"reflect"
	"slices"
	"strings"
	"testing"
)

// seedEverything gives an Owner one of each kind of data.
func seedEverything(t *testing.T, c *client) {
	t.Helper()
	work := createCategory(t, c, "งาน")["id"]
	createCategory(t, c, "บ้าน")
	createTask(t, c, map[string]any{
		"name": "ประชุม", "dueDate": "2026-11-27", "startDate": "2026-11-25", "startTime": "09:00", "endTime": "10:30",
		"priority": "high", "progress": 40, "note": "เตรียมสไลด์", "categoryId": work,
	})
	createTask(t, c, map[string]any{"name": "จ่ายค่าไฟ", "dueDate": "2026-11-20", "progress": 100})
	c.do(http.MethodPut, "/api/routine", map[string]any{"entries": []map[string]any{{"hour": 6, "text": "วิ่ง"}, {"hour": 22, "text": "อ่านหนังสือ"}}})
	saveChecklist(t, c, "2026-11-20", map[string]any{"glasses": 7, "breakfastMenu": "ข้าวต้ม", "breakfastDone": true, "note": "ดีมาก"})
	saveChecklist(t, c, "2026-11-21", map[string]any{"glasses": 3})
	c.do(http.MethodPut, "/api/settings", map[string]any{"waterGoal": 12})
}

func exportBackup(t *testing.T, c *client) map[string]any {
	t.Helper()
	res := c.do(http.MethodGet, "/api/backup", nil)
	if res.Status != http.StatusOK {
		t.Fatalf("export: %d %v", res.Status, res.Body)
	}
	return res.Body
}

func importBackup(c *client, backup any) response {
	return c.do(http.MethodPost, "/api/backup", backup)
}

// comparable strips what an import does not keep the same: IDs and the export time.
func comparable(backup map[string]any) map[string]any {
	out := map[string]any{}
	for key, value := range backup {
		out[key] = value
	}
	delete(out, "exportedAt")
	names := map[any]any{}
	var categories []string
	for _, item := range backup["categories"].([]any) {
		category := item.(map[string]any)
		names[category["id"]] = category["name"]
		categories = append(categories, category["name"].(string))
	}
	slices.Sort(categories)
	out["categories"] = categories
	var tasks []string
	for _, item := range backup["tasks"].([]any) {
		task := map[string]any{}
		for key, value := range item.(map[string]any) {
			task[key] = value
		}
		task["categoryId"] = names[task["categoryId"]]
		encoded, _ := json.Marshal(task)
		tasks = append(tasks, string(encoded))
	}
	slices.Sort(tasks)
	out["tasks"] = tasks
	return out
}

// Export then import into another Owner yields the same data (D33, D34, T2).
func TestBackupRoundTrip(t *testing.T) {
	s := newTestServer(t)
	owner := s.signedInOwner("owner@example.com")
	seedEverything(t, owner)

	backup := exportBackup(t, owner)
	if backup["format"] != "planner-backup" || backup["version"] != float64(1) || backup["exportedAt"] == nil {
		t.Errorf("header = %v %v %v", backup["format"], backup["version"], backup["exportedAt"])
	}
	if n := len(backup["tasks"].([]any)); n != 2 {
		t.Errorf("tasks = %d, want 2", n)
	}

	other := s.signedInOwner("other@example.com")
	res := importBackup(other, backup)
	if res.Status != http.StatusOK {
		t.Fatalf("import: %d %v", res.Status, res.Body)
	}
	imported := res.Body["imported"].(map[string]any)
	if imported["categories"] != float64(2) || imported["tasks"] != float64(2) || imported["routine"] != float64(2) || imported["checklists"] != float64(2) {
		t.Errorf("imported = %v", imported)
	}

	again := exportBackup(t, other)
	if want, got := comparable(backup), comparable(again); !reflect.DeepEqual(want, got) {
		t.Errorf("round trip changed the data:\nbefore %v\nafter  %v", want, got)
	}
	// The imported Task is usable through the normal endpoints, with its Category.
	tasks := listRange(t, other, "2026-11-01", "2026-11-30")
	if !slices.Contains(tasks, "ประชุม") {
		t.Errorf("tasks after import = %v", tasks)
	}
}

// The export holds no password hash and no session (D33).
func TestBackupHoldsNoSecrets(t *testing.T) {
	s := newTestServer(t)
	owner := s.signedInOwner("owner@example.com")
	seedEverything(t, owner)

	res := owner.do(http.MethodGet, "/api/backup", nil)
	encoded, _ := json.Marshal(res.Body)
	for _, secret := range []string{"password", "$2a$", "session", "token", "owner@example.com"} {
		if strings.Contains(strings.ToLower(string(encoded)), strings.ToLower(secret)) {
			t.Errorf("the backup contains %q", secret)
		}
	}
}

// Importing replaces all data rather than merging (D34).
func TestBackupImportReplaces(t *testing.T) {
	s := newTestServer(t)
	owner := s.signedInOwner("owner@example.com")
	seedEverything(t, owner)
	backup := exportBackup(t, owner)

	createTask(t, owner, map[string]any{"name": "added later", "dueDate": "2026-11-22"})
	createCategory(t, owner, "เพิ่มทีหลัง")
	saveChecklist(t, owner, "2026-11-22", map[string]any{"glasses": 1})

	if res := importBackup(owner, backup); res.Status != http.StatusOK {
		t.Fatalf("import: %d %v", res.Status, res.Body)
	}
	if want, got := comparable(backup), comparable(exportBackup(t, owner)); !reflect.DeepEqual(want, got) {
		t.Errorf("import merged instead of replacing:\nwant %v\ngot  %v", want, got)
	}
	assertEmptyChecklist(t, getChecklist(t, owner, "2026-11-22"), "2026-11-22")

	// An empty backup empties everything, settings back to the file's.
	empty := map[string]any{"format": "planner-backup", "version": 1, "categories": []any{}, "tasks": []any{}, "routine": []any{}, "checklists": []any{}, "settings": map[string]any{"waterGoal": 8}}
	if res := importBackup(owner, empty); res.Status != http.StatusOK {
		t.Fatalf("import empty: %d %v", res.Status, res.Body)
	}
	after := exportBackup(t, owner)
	for _, key := range []string{"categories", "tasks", "routine", "checklists"} {
		if n := len(after[key].([]any)); n != 0 {
			t.Errorf("%s has %d items after importing an empty backup", key, n)
		}
	}
}

// A malformed file is refused and changes nothing (D34, T2).
func TestBackupImportRejectsMalformedFiles(t *testing.T) {
	s := newTestServer(t)
	owner := s.signedInOwner("owner@example.com")
	seedEverything(t, owner)
	before := exportBackup(t, owner)

	// broken returns a copy of the valid backup with one change.
	broken := func(change func(b map[string]any)) map[string]any {
		encoded, _ := json.Marshal(before)
		var b map[string]any
		_ = json.Unmarshal(encoded, &b)
		change(b)
		return b
	}
	firstTask := func(b map[string]any) map[string]any { return b["tasks"].([]any)[0].(map[string]any) }
	cases := map[string]any{
		"not an object":    []any{1, 2},
		"wrong format":     broken(func(b map[string]any) { b["format"] = "other-app" }),
		"wrong version":    broken(func(b map[string]any) { b["version"] = 2 }),
		"task without due": broken(func(b map[string]any) { delete(firstTask(b), "dueDate") }),
		"task bad date":    broken(func(b map[string]any) { firstTask(b)["dueDate"] = "27/11/2569" }),
		"missing category": broken(func(b map[string]any) { firstTask(b)["categoryId"] = 999999 }),
		"done without time": broken(func(b map[string]any) {
			firstTask(b)["progress"] = 100
			firstTask(b)["completedAt"] = nil
		}),
		"duplicate category name": broken(func(b map[string]any) {
			b["categories"] = append(b["categories"].([]any), map[string]any{"id": 424242, "name": "งาน"})
		}),
		"duplicate checklist date": broken(func(b map[string]any) {
			b["checklists"] = append(b["checklists"].([]any), b["checklists"].([]any)[0])
		}),
		"routine hour": broken(func(b map[string]any) { b["routine"] = []any{map[string]any{"hour": 3, "text": "x"}} }),
		"glasses":      broken(func(b map[string]any) { b["checklists"].([]any)[0].(map[string]any)["glasses"] = 99 }),
		"water goal":   broken(func(b map[string]any) { b["settings"] = map[string]any{"waterGoal": 0} }),
	}
	for name, body := range cases {
		res := importBackup(owner, body)
		if res.Status != http.StatusUnprocessableEntity {
			t.Errorf("%s: %d %v, want 422", name, res.Status, res.Body)
			continue
		}
		if code := res.Body["error"].(map[string]any)["code"]; code != "invalid_backup" {
			t.Errorf("%s: code %v, want invalid_backup", name, code)
		}
	}
	if want, got := comparable(before), comparable(exportBackup(t, owner)); !reflect.DeepEqual(want, got) {
		t.Errorf("a refused import changed the data:\nwant %v\ngot  %v", want, got)
	}
}

func TestBackupNeedsASession(t *testing.T) {
	s := newTestServer(t)
	assertError(t, s.do(http.MethodGet, "/api/backup", nil), http.StatusUnauthorized, "unauthorized")
	assertError(t, s.do(http.MethodPost, "/api/backup", map[string]any{}), http.StatusUnauthorized, "unauthorized")
}
