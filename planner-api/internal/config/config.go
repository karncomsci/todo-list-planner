// Package config reads and checks the API's settings from the environment.
package config

import (
	"errors"
	"fmt"
	"strconv"
)

// Config is every setting the API reads at start.
type Config struct {
	DatabaseURL string
	Port        int
	// OwnerEmail and OwnerPassword create the Owner on first run (D16); they
	// may be empty once an Owner exists, which only the database can tell.
	OwnerEmail    string
	OwnerPassword string
	// SecureCookie marks the session cookie Secure, for serving over HTTPS.
	SecureCookie bool
}

// Load reads the settings through getenv (os.Getenv in production) and
// reports every missing or malformed one at once.
func Load(getenv func(string) string) (Config, error) {
	cfg := Config{
		DatabaseURL:   getenv("DATABASE_URL"),
		Port:          8080,
		OwnerEmail:    getenv("OWNER_EMAIL"),
		OwnerPassword: getenv("OWNER_PASSWORD"),
	}
	var problems []error

	if cfg.DatabaseURL == "" {
		problems = append(problems, errors.New("DATABASE_URL is required"))
	}
	if value := getenv("PORT"); value != "" {
		port, err := strconv.Atoi(value)
		if err != nil || port < 1 || port > 65535 {
			problems = append(problems, fmt.Errorf("PORT must be a number from 1 to 65535, got %q", value))
		}
		cfg.Port = port
	}
	if value := getenv("COOKIE_SECURE"); value != "" {
		secure, err := strconv.ParseBool(value)
		if err != nil {
			problems = append(problems, fmt.Errorf("COOKIE_SECURE must be true or false, got %q", value))
		}
		cfg.SecureCookie = secure
	}

	if err := errors.Join(problems...); err != nil {
		return Config{}, fmt.Errorf("configuration: %w", err)
	}
	return cfg, nil
}
