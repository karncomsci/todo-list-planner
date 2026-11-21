package httpapi_test

import (
	"net/http"
	"testing"

	"github.com/gofiber/fiber/v3"
)

func TestHealthReportsOK(t *testing.T) {
	s := newTestServer(t)

	res := s.do(http.MethodGet, "/api/health", nil)

	if res.Status != http.StatusOK || res.Body["status"] != "ok" {
		t.Fatalf("got %d %v, want 200 {status: ok}", res.Status, res.Body)
	}
}

func TestHealthReportsUnreachableDatabase(t *testing.T) {
	s := newTestServer(t)
	s.pool.Close()

	res := s.do(http.MethodGet, "/api/health", nil)

	assertError(t, res, http.StatusServiceUnavailable, "database_unavailable")
}

func TestUnknownRouteUsesErrorShape(t *testing.T) {
	s := newTestServer(t)
	s.createOwner("owner@example.com", "correct-horse")
	owner := s.signIn("owner@example.com", "correct-horse")

	res := owner.do(http.MethodGet, "/api/does-not-exist", nil)

	assertError(t, res, http.StatusNotFound, "not_found")
}

func TestUnknownRouteWithoutSessionIsUnauthorized(t *testing.T) {
	s := newTestServer(t)

	res := s.do(http.MethodGet, "/api/does-not-exist", nil)

	assertError(t, res, http.StatusUnauthorized, "unauthorized")
}

func TestUnexpectedFailureUsesErrorShape(t *testing.T) {
	s := newTestServer(t)
	s.createOwner("owner@example.com", "correct-horse")
	owner := s.signIn("owner@example.com", "correct-horse")
	s.app.Get("/api/test-panic", func(fiber.Ctx) error { panic("boom") })

	res := owner.do(http.MethodGet, "/api/test-panic", nil)

	assertError(t, res, http.StatusInternalServerError, "internal")
	if msg := res.Body["error"].(map[string]any)["message"]; msg == "boom" {
		t.Errorf("internal details leaked to the client: %v", msg)
	}
}
