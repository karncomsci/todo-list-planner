package httpapi_test

import (
	"net/http"
	"strings"
	"testing"
)

func changePassword(c *client, current, next string) response {
	return c.do(http.MethodPut, "/api/password", map[string]any{"currentPassword": current, "newPassword": next})
}

// The new password signs in and the old one does not (story 54).
func TestChangePassword(t *testing.T) {
	s := newTestServer(t)
	owner := s.signedInOwner("owner@example.com")

	if res := changePassword(owner, "correct-horse", "battery-staple"); res.Status != http.StatusNoContent {
		t.Fatalf("change: %d %v", res.Status, res.Body)
	}
	s.signIn("owner@example.com", "battery-staple")
	res := s.do(http.MethodPost, "/api/session", map[string]any{"email": "owner@example.com", "password": "correct-horse"})
	assertError(t, res, http.StatusUnauthorized, "invalid_credentials")
}

// Other sessions end; the one that changed the password stays (D17).
func TestChangePasswordEndsOtherSessions(t *testing.T) {
	s := newTestServer(t)
	here := s.signedInOwner("owner@example.com")
	elsewhere := s.signIn("owner@example.com", "correct-horse")
	other := s.signedInOwner("other@example.com")

	if res := changePassword(here, "correct-horse", "battery-staple"); res.Status != http.StatusNoContent {
		t.Fatalf("change: %d %v", res.Status, res.Body)
	}
	if res := here.do(http.MethodGet, "/api/session", nil); res.Status != http.StatusOK {
		t.Errorf("this session: %d, want it kept", res.Status)
	}
	assertError(t, elsewhere.do(http.MethodGet, "/api/session", nil), http.StatusUnauthorized, "unauthorized")
	if res := other.do(http.MethodGet, "/api/session", nil); res.Status != http.StatusOK {
		t.Errorf("another Owner's session: %d, want it untouched", res.Status)
	}
}

func TestChangePasswordValidates(t *testing.T) {
	s := newTestServer(t)
	owner := s.signedInOwner("owner@example.com")

	assertValidation(t, changePassword(owner, "", "battery-staple"), "currentPassword", "required")
	assertValidation(t, changePassword(owner, "wrong-password", "battery-staple"), "currentPassword", "incorrect")
	assertValidation(t, changePassword(owner, "correct-horse", ""), "newPassword", "required")
	assertValidation(t, changePassword(owner, "correct-horse", "short7!"), "newPassword", "too_short")
	assertValidation(t, changePassword(owner, "correct-horse", strings.Repeat("a", 73)), "newPassword", "too_long")

	// None of those changed anything.
	s.signIn("owner@example.com", "correct-horse")
	// Eight characters and 72 bytes are the limits.
	if res := changePassword(owner, "correct-horse", "eight-ch"); res.Status != http.StatusNoContent {
		t.Errorf("8 characters: %d %v", res.Status, res.Body)
	}
	if res := changePassword(owner, "eight-ch", strings.Repeat("a", 72)); res.Status != http.StatusNoContent {
		t.Errorf("72 bytes: %d %v", res.Status, res.Body)
	}
}

func TestChangePasswordNeedsASession(t *testing.T) {
	s := newTestServer(t)
	assertError(t, changePassword(s.anonymous(), "correct-horse", "battery-staple"), http.StatusUnauthorized, "unauthorized")
}
