package httpapi

import (
	"errors"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/limiter"
	"github.com/jackc/pgx/v5"

	"planner-api/internal/auth"
	"planner-api/internal/database"
)

const (
	sessionCookie = "planner_session"
	// "Stay signed in" keeps the session for 30 days (A2).
	rememberedSessionTTL = 30 * 24 * time.Hour
	// Without it the cookie ends with the browser. The server also stops
	// honouring it after a day, in case the browser restores the cookie.
	browserSessionTTL = 24 * time.Hour
)

// Owner is the signed-in Owner as the API returns it.
type Owner struct {
	ID    int64  `json:"id"`
	Email string `json:"email"`
}

type ownerKey struct{}

// currentOwnerOf returns the Owner that requireOwner attached to the request.
// Every Owner-scoped query takes its Owner ID from here (D19).
func currentOwnerOf(c fiber.Ctx) Owner {
	return fiber.Locals[Owner](c, ownerKey{})
}

var errUnauthorized = &Error{Status: fiber.StatusUnauthorized, Code: "unauthorized", Message: "sign in first"}

// requireOwner rejects requests without a valid session.
func (s *server) requireOwner(c fiber.Ctx) error {
	token := c.Cookies(sessionCookie)
	if token == "" {
		return errUnauthorized
	}
	row, err := s.queries.GetSessionOwner(c.Context(), auth.HashToken(token))
	if errors.Is(err, pgx.ErrNoRows) {
		s.clearSessionCookie(c) // expired or signed out: stop the browser sending it
		return errUnauthorized
	}
	if err != nil {
		return err
	}
	fiber.Locals(c, ownerKey{}, Owner{ID: row.ID, Email: row.Email})
	return c.Next()
}

type signInRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Remember bool   `json:"remember"`
}

func (s *server) signIn(c fiber.Ctx) error {
	var req signInRequest
	if err := c.Bind().JSON(&req); err != nil {
		return errBadJSON
	}
	email := auth.NormalizeEmail(req.Email)
	if email == "" {
		return validation("email", "required", "email is required")
	}
	if req.Password == "" {
		return validation("password", "required", "password is required")
	}

	owner, err := s.queries.GetOwnerByEmail(c.Context(), email)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return err
	}
	// One answer for a wrong email and a wrong password (story 5).
	if !auth.PasswordMatches(owner.PasswordHash, req.Password) {
		return &Error{Status: fiber.StatusUnauthorized, Code: "invalid_credentials", Message: "email or password is wrong"}
	}

	if err := s.queries.DeleteExpiredSessions(c.Context()); err != nil {
		return err
	}
	ttl := browserSessionTTL
	if req.Remember {
		ttl = rememberedSessionTTL
	}
	token, hash := auth.NewSessionToken()
	expires := time.Now().Add(ttl)
	err = s.queries.CreateSession(c.Context(), database.CreateSessionParams{TokenHash: hash, OwnerID: owner.ID, ExpiresAt: expires})
	if err != nil {
		return err
	}

	cookie := s.baseCookie(token)
	if req.Remember {
		cookie.Expires = expires
		cookie.MaxAge = int(ttl.Seconds())
	} else {
		cookie.SessionOnly = true
	}
	c.Cookie(cookie)
	return c.JSON(fiber.Map{"owner": Owner{ID: owner.ID, Email: owner.Email}})
}

// signOut deletes the session at once (D17). It succeeds even without a session.
func (s *server) signOut(c fiber.Ctx) error {
	if token := c.Cookies(sessionCookie); token != "" {
		if err := s.queries.DeleteSession(c.Context(), auth.HashToken(token)); err != nil {
			return err
		}
	}
	s.clearSessionCookie(c)
	return c.SendStatus(fiber.StatusNoContent)
}

func (s *server) currentOwner(c fiber.Ctx) error {
	return c.JSON(fiber.Map{"owner": currentOwnerOf(c)})
}

func (s *server) baseCookie(value string) *fiber.Cookie {
	return &fiber.Cookie{
		Name:     sessionCookie,
		Value:    value,
		Path:     "/",
		HTTPOnly: true,
		SameSite: fiber.CookieSameSiteLaxMode,
		Secure:   s.opts.SecureCookie,
	}
}

func (s *server) clearSessionCookie(c fiber.Ctx) {
	cookie := s.baseCookie("")
	cookie.MaxAge = -1
	cookie.Expires = time.Unix(0, 0)
	c.Cookie(cookie)
}

// signInLimiter slows down password guessing: at most 10 failed sign-ins a minute.
func signInLimiter() fiber.Handler {
	return limiter.New(limiter.Config{
		Max:                    10,
		Expiration:             time.Minute,
		SkipSuccessfulRequests: true,
		LimitReached: func(fiber.Ctx) error {
			return &Error{Status: fiber.StatusTooManyRequests, Code: "too_many_attempts", Message: "too many failed sign-ins, wait a minute"}
		},
	})
}
