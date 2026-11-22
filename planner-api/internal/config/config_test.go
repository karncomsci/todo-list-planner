package config_test

import (
	"strings"
	"testing"

	"planner-api/internal/config"
)

func env(values map[string]string) func(string) string {
	return func(key string) string { return values[key] }
}

func TestLoadDefaults(t *testing.T) {
	cfg, err := config.Load(env(map[string]string{"DATABASE_URL": "postgres://x"}))
	if err != nil {
		t.Fatal(err)
	}
	if cfg.Port != 8080 || cfg.SecureCookie {
		t.Errorf("defaults = %+v", cfg)
	}
}

func TestLoadReadsEverySetting(t *testing.T) {
	cfg, err := config.Load(env(map[string]string{
		"DATABASE_URL": "postgres://x", "PORT": "9000", "COOKIE_SECURE": "true",
		"OWNER_EMAIL": "owner@example.com", "OWNER_PASSWORD": "correct-horse",
	}))
	if err != nil {
		t.Fatal(err)
	}
	want := config.Config{DatabaseURL: "postgres://x", Port: 9000, SecureCookie: true, OwnerEmail: "owner@example.com", OwnerPassword: "correct-horse"}
	if cfg != want {
		t.Errorf("got %+v, want %+v", cfg, want)
	}
}

// Every problem is reported at once, so one restart fixes them all.
func TestLoadReportsEveryProblem(t *testing.T) {
	_, err := config.Load(env(map[string]string{"PORT": "eighty", "COOKIE_SECURE": "yes please"}))
	if err == nil {
		t.Fatal("want an error")
	}
	for _, name := range []string{"DATABASE_URL", "PORT", "COOKIE_SECURE"} {
		if !strings.Contains(err.Error(), name) {
			t.Errorf("error %q does not name %s", err, name)
		}
	}
	if _, err := config.Load(env(map[string]string{"DATABASE_URL": "postgres://x", "PORT": "70000"})); err == nil {
		t.Error("PORT 70000 was accepted")
	}
}
