package httpapi_test

import (
	"fmt"
	"net/http"
	"strings"
	"testing"
)

func categoryPath(id any) string { return fmt.Sprintf("/api/categories/%v", id) }

// Renaming keeps the Category's Tasks with it (story 55).
func TestRenameCategory(t *testing.T) {
	s := newTestServer(t)
	owner := s.signedInOwner("owner@example.com")
	work := createCategory(t, owner, "งาน")
	task := createTask(t, owner, map[string]any{"name": "ส่งรายงาน", "dueDate": "2026-11-25", "categoryId": work["id"]})

	res := owner.do(http.MethodPut, categoryPath(work["id"]), map[string]any{"name": "  งานออฟฟิศ "})
	if res.Status != http.StatusOK {
		t.Fatalf("rename: %d %v", res.Status, res.Body)
	}
	if got := res.Body["category"].(map[string]any)["name"]; got != "งานออฟฟิศ" {
		t.Errorf("name = %v", got)
	}
	got := owner.do(http.MethodGet, fmt.Sprintf("/api/tasks/%v", task["id"]), nil).Body["task"].(map[string]any)
	if category := got["category"].(map[string]any); category["name"] != "งานออฟฟิศ" {
		t.Errorf("Task's category = %v", category)
	}
}

func TestRenameCategoryValidates(t *testing.T) {
	s := newTestServer(t)
	owner := s.signedInOwner("owner@example.com")
	work := createCategory(t, owner, "Work")
	createCategory(t, owner, "Home")

	assertValidation(t, owner.do(http.MethodPut, categoryPath(work["id"]), map[string]any{"name": " "}), "name", "required")
	assertValidation(t, owner.do(http.MethodPut, categoryPath(work["id"]), map[string]any{"name": strings.Repeat("ก", 51)}), "name", "too_long")
	assertValidation(t, owner.do(http.MethodPut, categoryPath(work["id"]), map[string]any{"name": "home"}), "name", "duplicate")

	// Its own name in another letter case is fine.
	if res := owner.do(http.MethodPut, categoryPath(work["id"]), map[string]any{"name": "WORK"}); res.Status != http.StatusOK {
		t.Errorf("rename to WORK: %d %v", res.Status, res.Body)
	}
}

// Deleting a Category leaves its Tasks, uncategorised (D24, story 56, T2).
func TestDeleteCategoryKeepsItsTasks(t *testing.T) {
	s := newTestServer(t)
	owner := s.signedInOwner("owner@example.com")
	work := createCategory(t, owner, "งาน")
	task := createTask(t, owner, map[string]any{"name": "ส่งรายงาน", "dueDate": "2026-11-25", "categoryId": work["id"]})

	if res := owner.do(http.MethodDelete, categoryPath(work["id"]), nil); res.Status != http.StatusNoContent {
		t.Fatalf("delete: %d %v", res.Status, res.Body)
	}
	got := owner.do(http.MethodGet, fmt.Sprintf("/api/tasks/%v", task["id"]), nil)
	if got.Status != http.StatusOK {
		t.Fatalf("the Task is gone: %d", got.Status)
	}
	if category := got.Body["task"].(map[string]any)["category"]; category != nil {
		t.Errorf("category = %v, want null", category)
	}
	if names := listCategoryNames(t, owner); len(names) != 0 {
		t.Errorf("categories = %v", names)
	}
	assertError(t, owner.do(http.MethodDelete, categoryPath(work["id"]), nil), http.StatusNotFound, "not_found")
}

func TestChangeCategoryIsOwnerScoped(t *testing.T) {
	s := newTestServer(t)
	owner := s.signedInOwner("owner@example.com")
	other := s.signedInOwner("other@example.com")
	theirs := createCategory(t, other, "ของเขา")

	assertError(t, owner.do(http.MethodPut, categoryPath(theirs["id"]), map[string]any{"name": "x"}), http.StatusNotFound, "not_found")
	assertError(t, owner.do(http.MethodDelete, categoryPath(theirs["id"]), nil), http.StatusNotFound, "not_found")
	assertError(t, owner.do(http.MethodDelete, categoryPath("abc"), nil), http.StatusNotFound, "not_found")
	if names := listCategoryNames(t, other); len(names) != 1 || names[0] != "ของเขา" {
		t.Errorf("other's categories = %v", names)
	}
}
