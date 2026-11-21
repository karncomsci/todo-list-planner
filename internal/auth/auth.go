// Package auth holds the Owner's credentials and session tokens (D16–D18).
package auth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"
	"sync"

	"golang.org/x/crypto/bcrypt"

	"planner-api/internal/database"
)

// MinPasswordLength applies to every password the system stores.
const MinPasswordLength = 8

// NormalizeEmail is the one form of an email address the system stores and compares.
func NormalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}

// HashPassword returns a one-way hash; the password itself is never stored (D18).
func HashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", fmt.Errorf("hash password: %w", err)
	}
	return string(hash), nil
}

// PasswordMatches reports whether password matches hash. An empty hash (no
// such Owner) still costs one comparison, so response time does not reveal
// whether an email exists.
func PasswordMatches(hash, password string) bool {
	if hash == "" {
		_ = bcrypt.CompareHashAndPassword([]byte(dummyHash()), []byte(password))
		return false
	}
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) == nil
}

var dummyHash = sync.OnceValue(func() string {
	hash, _ := bcrypt.GenerateFromPassword([]byte(rand.Text()), bcrypt.DefaultCost)
	return string(hash)
})

// EnsureOwner creates the Owner from the initial email and password when no
// Owner exists yet, and does nothing otherwise (D16).
func EnsureOwner(ctx context.Context, q *database.Queries, email, password string) (created bool, err error) {
	count, err := q.CountOwners(ctx)
	if err != nil {
		return false, fmt.Errorf("count owners: %w", err)
	}
	if count > 0 {
		return false, nil
	}
	email = NormalizeEmail(email)
	if email == "" || password == "" {
		return false, errors.New("no Owner exists yet: set OWNER_EMAIL and OWNER_PASSWORD")
	}
	if len(password) < MinPasswordLength {
		return false, fmt.Errorf("OWNER_PASSWORD must be at least %d characters", MinPasswordLength)
	}
	hash, err := HashPassword(password)
	if err != nil {
		return false, err
	}
	if _, err := q.CreateOwner(ctx, database.CreateOwnerParams{Email: email, PasswordHash: hash}); err != nil {
		return false, fmt.Errorf("create owner: %w", err)
	}
	return true, nil
}

// NewSessionToken returns a random token for the cookie and the hash to store.
func NewSessionToken() (token string, hash []byte) {
	raw := make([]byte, 32)
	_, _ = rand.Read(raw) // crypto/rand.Read never returns an error
	token = base64.RawURLEncoding.EncodeToString(raw)
	return token, HashToken(token)
}

// HashToken is how a cookie token is looked up in the sessions table.
func HashToken(token string) []byte {
	sum := sha256.Sum256([]byte(token))
	return sum[:]
}
