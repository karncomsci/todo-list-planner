package httpapi_test

import (
	"context"
	"net/http"
	"testing"
	"time"

	"planner-api/internal/auth"
)

const (
	ownerEmail    = "owner@example.com"
	ownerPassword = "correct-horse"
)

func TestSignInReturnsOwnerAndSessionCookie(t *testing.T) {
	s := newTestServer(t)
	s.createOwner(ownerEmail, ownerPassword)

	res := s.do(http.MethodPost, "/api/session", map[string]any{"email": ownerEmail, "password": ownerPassword})

	if res.Status != http.StatusOK {
		t.Fatalf("status = %d, body %v", res.Status, res.Body)
	}
	if got := res.Body["owner"].(map[string]any)["email"]; got != ownerEmail {
		t.Errorf("owner.email = %v", got)
	}
	cookie := res.cookie("planner_session")
	if cookie == nil || cookie.Value == "" {
		t.Fatal("no session cookie")
	}
	if !cookie.HttpOnly {
		t.Error("session cookie is not HttpOnly (D17)")
	}
	if cookie.SameSite != http.SameSiteLaxMode {
		t.Errorf("SameSite = %v, want Lax", cookie.SameSite)
	}
	if cookie.MaxAge != 0 || !cookie.Expires.IsZero() {
		t.Errorf("without stay-signed-in the cookie must end with the browser (A2): MaxAge %d, Expires %v", cookie.MaxAge, cookie.Expires)
	}
}

func TestStaySignedInKeepsCookieFor30Days(t *testing.T) {
	s := newTestServer(t)
	s.createOwner(ownerEmail, ownerPassword)

	res := s.do(http.MethodPost, "/api/session", map[string]any{"email": ownerEmail, "password": ownerPassword, "remember": true})

	cookie := res.cookie("planner_session")
	if cookie == nil {
		t.Fatalf("no session cookie: %d %v", res.Status, res.Body)
	}
	if want := int((30 * 24 * time.Hour).Seconds()); cookie.MaxAge != want {
		t.Errorf("MaxAge = %d, want %d (A2)", cookie.MaxAge, want)
	}
}

func TestSignInIgnoresEmailCase(t *testing.T) {
	s := newTestServer(t)
	s.createOwner(ownerEmail, ownerPassword)

	res := s.do(http.MethodPost, "/api/session", map[string]any{"email": "  Owner@Example.COM ", "password": ownerPassword})

	if res.Status != http.StatusOK {
		t.Fatalf("status = %d, body %v", res.Status, res.Body)
	}
}

func TestSignInRejectsWrongPasswordAndUnknownEmailAlike(t *testing.T) {
	s := newTestServer(t)
	s.createOwner(ownerEmail, ownerPassword)

	wrongPassword := s.do(http.MethodPost, "/api/session", map[string]any{"email": ownerEmail, "password": "wrong-password"})
	unknownEmail := s.do(http.MethodPost, "/api/session", map[string]any{"email": "nobody@example.com", "password": ownerPassword})

	assertError(t, wrongPassword, http.StatusUnauthorized, "invalid_credentials")
	assertError(t, unknownEmail, http.StatusUnauthorized, "invalid_credentials")
	if wrongPassword.cookie("planner_session") != nil {
		t.Error("a failed sign-in set a session cookie")
	}
}

func TestSignInNamesMissingField(t *testing.T) {
	s := newTestServer(t)

	assertValidation(t, s.do(http.MethodPost, "/api/session", map[string]any{"password": ownerPassword}), "email", "required")
	assertValidation(t, s.do(http.MethodPost, "/api/session", map[string]any{"email": ownerEmail}), "password", "required")
	assertError(t, s.do(http.MethodPost, "/api/session", "not json"), http.StatusBadRequest, "bad_request")
}

func TestSignInIsLimitedAfterRepeatedFailures(t *testing.T) {
	s := newTestServer(t)
	s.createOwner(ownerEmail, ownerPassword)
	wrong := map[string]any{"email": ownerEmail, "password": "wrong-password"}

	for range 10 {
		assertError(t, s.do(http.MethodPost, "/api/session", wrong), http.StatusUnauthorized, "invalid_credentials")
	}

	assertError(t, s.do(http.MethodPost, "/api/session", wrong), http.StatusTooManyRequests, "too_many_attempts")
}

func TestCurrentOwnerNeedsSession(t *testing.T) {
	s := newTestServer(t)
	s.createOwner(ownerEmail, ownerPassword)
	owner := s.signIn(ownerEmail, ownerPassword)

	signedIn := owner.do(http.MethodGet, "/api/session", nil)
	signedOut := s.do(http.MethodGet, "/api/session", nil)

	if signedIn.Status != http.StatusOK || signedIn.Body["owner"].(map[string]any)["email"] != ownerEmail {
		t.Errorf("with session: %d %v", signedIn.Status, signedIn.Body)
	}
	assertError(t, signedOut, http.StatusUnauthorized, "unauthorized")
}

func TestForgedCookieIsRejected(t *testing.T) {
	s := newTestServer(t)
	c := s.anonymous()
	c.cookie = &http.Cookie{Name: "planner_session", Value: "made-up-token"}

	res := c.do(http.MethodGet, "/api/session", nil)

	assertError(t, res, http.StatusUnauthorized, "unauthorized")
	if cleared := res.cookie("planner_session"); cleared == nil || cleared.MaxAge >= 0 {
		t.Error("an invalid cookie is not cleared, so the browser keeps sending it")
	}
}

func TestSessionIsUnusableAfterSignOut(t *testing.T) {
	s := newTestServer(t)
	s.createOwner(ownerEmail, ownerPassword)
	owner := s.signIn(ownerEmail, ownerPassword)

	out := owner.do(http.MethodDelete, "/api/session", nil)

	if out.Status != http.StatusNoContent {
		t.Fatalf("sign out: %d %v", out.Status, out.Body)
	}
	if cleared := out.cookie("planner_session"); cleared == nil || cleared.MaxAge >= 0 {
		t.Error("sign-out does not clear the cookie")
	}
	assertError(t, owner.do(http.MethodGet, "/api/session", nil), http.StatusUnauthorized, "unauthorized")
}

func TestSignOutWithoutSessionSucceeds(t *testing.T) {
	s := newTestServer(t)

	res := s.do(http.MethodDelete, "/api/session", nil)

	if res.Status != http.StatusNoContent {
		t.Fatalf("status = %d, body %v", res.Status, res.Body)
	}
}

func TestExpiredSessionIsRejected(t *testing.T) {
	s := newTestServer(t)
	s.createOwner(ownerEmail, ownerPassword)
	owner := s.signIn(ownerEmail, ownerPassword)
	if _, err := s.pool.Exec(context.Background(), "UPDATE sessions SET expires_at = now() - interval '1 second'"); err != nil {
		t.Fatal(err)
	}

	assertError(t, owner.do(http.MethodGet, "/api/session", nil), http.StatusUnauthorized, "unauthorized")
}

func TestOwnerIsSeededOnlyOnce(t *testing.T) {
	s := newTestServer(t)
	ctx := context.Background()

	created, err := auth.EnsureOwner(ctx, s.queries, " Owner@Example.com ", ownerPassword)
	if err != nil || !created {
		t.Fatalf("first run: created %v, err %v", created, err)
	}
	created, err = auth.EnsureOwner(ctx, s.queries, "other@example.com", "another-password")
	if err != nil || created {
		t.Fatalf("second run: created %v, err %v; want nothing created", created, err)
	}

	count, _ := s.queries.CountOwners(ctx)
	if count != 1 {
		t.Errorf("owners = %d, want 1", count)
	}
	s.signIn(ownerEmail, ownerPassword) // the first password still works
	assertError(t, s.do(http.MethodPost, "/api/session", map[string]any{"email": "other@example.com", "password": "another-password"}), http.StatusUnauthorized, "invalid_credentials")
}

func TestSeedingNeedsInitialCredentials(t *testing.T) {
	s := newTestServer(t)
	ctx := context.Background()

	if _, err := auth.EnsureOwner(ctx, s.queries, "", ""); err == nil {
		t.Error("no Owner and no initial credentials: want an error")
	}
	if _, err := auth.EnsureOwner(ctx, s.queries, ownerEmail, "short"); err == nil {
		t.Error("initial password under 8 characters: want an error")
	}
}

func TestPasswordIsStoredOnlyAsHash(t *testing.T) {
	s := newTestServer(t)
	s.createOwner(ownerEmail, ownerPassword)

	var stored string
	if err := s.pool.QueryRow(context.Background(), "SELECT password_hash FROM owners").Scan(&stored); err != nil {
		t.Fatal(err)
	}
	if stored == ownerPassword || stored == "" {
		t.Errorf("password stored in a recoverable form (D18): %q", stored)
	}
}
