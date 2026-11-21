package httpapi_test

// Test harness: every test gets its own freshly migrated database on the
// PostgreSQL server named by TEST_DATABASE_URL, and drives the real Fiber app
// with real HTTP requests (T1). Later API tests follow this pattern (T5).

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"planner-api/internal/auth"
	"planner-api/internal/database"
	"planner-api/internal/httpapi"
)

type testServer struct {
	t       *testing.T
	app     *fiber.App
	pool    *pgxpool.Pool
	queries *database.Queries
}

func newTestServer(t *testing.T) *testServer {
	t.Helper()
	return newTestServerWith(t, httpapi.Options{})
}

// newTestServerAt pins the API clock, so "today" in Thailand is known (D23).
func newTestServerAt(t *testing.T, now time.Time) *testServer {
	t.Helper()
	return newTestServerWith(t, httpapi.Options{Now: func() time.Time { return now }})
}

func newTestServerWith(t *testing.T, opts httpapi.Options) *testServer {
	t.Helper()
	pool := newTestDatabase(t)
	return &testServer{t: t, app: httpapi.New(pool, opts), pool: pool, queries: database.New(pool)}
}

// signedInOwner creates an Owner and returns a client signed in as them.
func (s *testServer) signedInOwner(email string) *client {
	s.t.Helper()
	s.createOwner(email, "correct-horse")
	return s.signIn(email, "correct-horse")
}

// newTestDatabase creates an empty database, applies all migrations, and drops it after the test.
func newTestDatabase(t *testing.T) *pgxpool.Pool {
	t.Helper()
	adminURL := os.Getenv("TEST_DATABASE_URL")
	if adminURL == "" {
		t.Fatal("TEST_DATABASE_URL is not set; start the database with `docker compose up -d db` in the parent folder (see planner-api/CLAUDE.md)")
	}
	ctx := context.Background()

	admin, err := pgx.Connect(ctx, adminURL)
	if err != nil {
		t.Fatalf("connect to test server: %v", err)
	}
	defer admin.Close(ctx)

	suffix := make([]byte, 6)
	_, _ = rand.Read(suffix)
	name := "planner_test_" + hex.EncodeToString(suffix)
	if _, err := admin.Exec(ctx, "CREATE DATABASE "+name); err != nil {
		t.Fatalf("create test database: %v", err)
	}
	t.Cleanup(func() {
		conn, err := pgx.Connect(context.Background(), adminURL)
		if err != nil {
			t.Errorf("connect to drop test database: %v", err)
			return
		}
		defer conn.Close(context.Background())
		if _, err := conn.Exec(context.Background(), "DROP DATABASE "+name+" WITH (FORCE)"); err != nil {
			t.Errorf("drop test database: %v", err)
		}
	})

	cfg, err := pgxpool.ParseConfig(adminURL)
	if err != nil {
		t.Fatalf("parse TEST_DATABASE_URL: %v", err)
	}
	cfg.ConnConfig.Database = name
	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		t.Fatalf("open test database: %v", err)
	}
	t.Cleanup(pool.Close)

	if err := database.Migrate(ctx, pool); err != nil {
		t.Fatalf("migrate test database: %v", err)
	}
	return pool
}

// createOwner stores an Owner directly, so a test can have several (D19).
func (s *testServer) createOwner(email, password string) {
	s.t.Helper()
	hash, err := auth.HashPassword(password)
	if err != nil {
		s.t.Fatal(err)
	}
	if _, err := s.queries.CreateOwner(context.Background(), database.CreateOwnerParams{Email: email, PasswordHash: hash}); err != nil {
		s.t.Fatalf("create owner: %v", err)
	}
}

// client is one browser: it sends the session cookie it was given, if any.
type client struct {
	s      *testServer
	cookie *http.Cookie
}

func (s *testServer) anonymous() *client { return &client{s: s} }

// signIn signs in and returns a client carrying the session cookie.
func (s *testServer) signIn(email, password string) *client {
	s.t.Helper()
	c := s.anonymous()
	res := c.do(http.MethodPost, "/api/session", map[string]any{"email": email, "password": password})
	if res.Status != http.StatusOK {
		s.t.Fatalf("sign in as %s: %d %v", email, res.Status, res.Body)
	}
	c.cookie = res.cookie("planner_session")
	if c.cookie == nil || c.cookie.Value == "" {
		s.t.Fatalf("sign in as %s: no session cookie", email)
	}
	return c
}

// do sends a request without a session.
func (s *testServer) do(method, path string, body any) response {
	s.t.Helper()
	return s.anonymous().do(method, path, body)
}

type response struct {
	Status  int
	Body    map[string]any
	Cookies []*http.Cookie
}

func (r response) cookie(name string) *http.Cookie {
	for _, c := range r.Cookies {
		if c.Name == name {
			return c
		}
	}
	return nil
}

// do sends one request with an optional JSON body and decodes the JSON response.
// A string body is sent as-is, for malformed-input tests.
func (c *client) do(method, path string, body any) response {
	t := c.s.t
	t.Helper()
	var reader io.Reader
	switch b := body.(type) {
	case nil:
	case string:
		reader = strings.NewReader(b)
	default:
		raw, err := json.Marshal(b)
		if err != nil {
			t.Fatalf("encode request body: %v", err)
		}
		reader = strings.NewReader(string(raw))
	}
	req := httptest.NewRequest(method, path, reader)
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	if c.cookie != nil {
		req.AddCookie(&http.Cookie{Name: c.cookie.Name, Value: c.cookie.Value})
	}
	// Fiber's default of one second fails on a busy machine (bcrypt alone can
	// take that long), which would make results depend on the machine, not the code.
	res, err := c.s.app.Test(req, fiber.TestConfig{Timeout: 30 * time.Second, FailOnTimeout: true})
	if err != nil {
		t.Fatalf("%s %s: %v", method, path, err)
	}
	defer res.Body.Close()

	out := response{Status: res.StatusCode, Cookies: res.Cookies()}
	raw, _ := io.ReadAll(res.Body)
	if len(raw) > 0 {
		if err := json.Unmarshal(raw, &out.Body); err != nil {
			t.Fatalf("%s %s: response is not JSON: %q", method, path, raw)
		}
	}
	return out
}

// assertError checks the D15 error shape.
func assertError(t *testing.T, res response, status int, code string) {
	t.Helper()
	if res.Status != status {
		t.Fatalf("status = %d, want %d (body %v)", res.Status, status, res.Body)
	}
	e, ok := res.Body["error"].(map[string]any)
	if !ok {
		t.Fatalf("body has no error object: %v", res.Body)
	}
	if e["code"] != code {
		t.Errorf("error.code = %v, want %q", e["code"], code)
	}
	if msg, _ := e["message"].(string); msg == "" {
		t.Errorf("error.message is empty")
	}
}

// assertValidation checks a validation error that names field and the rule it broke.
func assertValidation(t *testing.T, res response, field, code string) {
	t.Helper()
	assertError(t, res, http.StatusUnprocessableEntity, code)
	if got := res.Body["error"].(map[string]any)["field"]; got != field {
		t.Errorf("error.field = %v, want %q", got, field)
	}
}
