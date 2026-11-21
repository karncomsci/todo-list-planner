package httpapi_test

import (
	"net/http"
	"strings"
	"testing"
)

func createCategory(t *testing.T, c *client, name string) map[string]any {
	t.Helper()
	res := c.do(http.MethodPost, "/api/categories", map[string]any{"name": name})
	if res.Status != http.StatusCreated {
		t.Fatalf("create category %q: %d %v", name, res.Status, res.Body)
	}
	return res.Body["category"].(map[string]any)
}

func listCategoryNames(t *testing.T, c *client) []string {
	t.Helper()
	res := c.do(http.MethodGet, "/api/categories", nil)
	if res.Status != http.StatusOK {
		t.Fatalf("list categories: %d %v", res.Status, res.Body)
	}
	names := []string{}
	for _, item := range res.Body["categories"].([]any) {
		names = append(names, item.(map[string]any)["name"].(string))
	}
	return names
}

func TestCreateAndListCategories(t *testing.T) {
	s := newTestServer(t)
	owner := s.signedInOwner("owner@example.com")

	if names := listCategoryNames(t, owner); len(names) != 0 {
		t.Fatalf("new Owner has Categories %v", names)
	}

	work := createCategory(t, owner, "  งาน  ")
	if work["name"] != "งาน" {
		t.Errorf("name = %v, want trimmed", work["name"])
	}
	if id, _ := work["id"].(float64); id <= 0 {
		t.Errorf("id = %v", work["id"])
	}
	createCategory(t, owner, "Home")
	createCategory(t, owner, "assignments")

	got := strings.Join(listCategoryNames(t, owner), ",")
	if want := "assignments,Home,งาน"; got != want {
		t.Errorf("categories = %s, want %s (by name, ignoring case)", got, want)
	}
}

func TestCreateCategoryNamesTheWrongField(t *testing.T) {
	s := newTestServer(t)
	owner := s.signedInOwner("owner@example.com")
	createCategory(t, owner, "Home")

	cases := []struct {
		body map[string]any
		code string
	}{
		{map[string]any{}, "required"},
		{map[string]any{"name": "   "}, "required"},
		{map[string]any{"name": strings.Repeat("ก", 51)}, "too_long"},
		{map[string]any{"name": "Home"}, "duplicate"},
		{map[string]any{"name": " home "}, "duplicate"},
	}
	for _, tc := range cases {
		assertValidation(t, owner.do(http.MethodPost, "/api/categories", tc.body), "name", tc.code)
	}
	createCategory(t, owner, strings.Repeat("ก", 50))
}

func TestCategoriesBelongToOneOwner(t *testing.T) {
	s := newTestServer(t)
	owner := s.signedInOwner("owner@example.com")
	other := s.signedInOwner("other@example.com")

	theirs := createCategory(t, other, "Home")
	if names := listCategoryNames(t, owner); len(names) != 0 {
		t.Errorf("Owner sees another Owner's Categories %v", names)
	}
	// The same name is free for each Owner (D24).
	createCategory(t, owner, "Home")

	res := owner.do(http.MethodPost, "/api/tasks", map[string]any{
		"name": "งาน", "dueDate": "2026-11-25", "categoryId": theirs["id"],
	})
	assertValidation(t, res, "categoryId", "invalid_choice")
	assertValidation(t, owner.do(http.MethodPost, "/api/tasks", map[string]any{
		"name": "งาน", "dueDate": "2026-11-25", "categoryId": 999999,
	}), "categoryId", "invalid_choice")
	if tasks := listRecent(t, owner, 10); len(tasks) != 0 {
		t.Errorf("rejected Task was saved: %v", tasks)
	}

	assertError(t, s.do(http.MethodGet, "/api/categories", nil), http.StatusUnauthorized, "unauthorized")
	assertError(t, s.do(http.MethodPost, "/api/categories", map[string]any{"name": "x"}), http.StatusUnauthorized, "unauthorized")
}

func TestTaskWithAndWithoutCategory(t *testing.T) {
	s := newTestServer(t)
	owner := s.signedInOwner("owner@example.com")
	home := createCategory(t, owner, "Home")

	with := createTask(t, owner, map[string]any{"name": "ซักผ้า", "dueDate": "2026-11-25", "categoryId": home["id"]})
	category, _ := with["category"].(map[string]any)
	if category == nil || category["id"] != home["id"] || category["name"] != "Home" {
		t.Errorf("category = %v, want %v", with["category"], home)
	}

	for _, body := range []map[string]any{
		{"name": "ไม่มีหมวด", "dueDate": "2026-11-25"},
		{"name": "หมวดว่าง", "dueDate": "2026-11-25", "categoryId": nil},
	} {
		if task := createTask(t, owner, body); task["category"] != nil {
			t.Errorf("%v: category = %v, want null", body["name"], task["category"])
		}
	}

	recent := listRecent(t, owner, 10)
	oldest := recent[len(recent)-1].(map[string]any)
	if c, _ := oldest["category"].(map[string]any); c == nil || c["name"] != "Home" {
		t.Errorf("listed category = %v, want Home", oldest["category"])
	}
	if recent[0].(map[string]any)["category"] != nil {
		t.Errorf("listed uncategorised Task has %v", recent[0].(map[string]any)["category"])
	}
}
