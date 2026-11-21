// Package httpapi is the HTTP boundary of the API: routes, handlers and the error shape.
package httpapi

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/recover"
	"github.com/jackc/pgx/v5/pgxpool"

	"planner-api/internal/database"
)

// Options are the deployment settings of the HTTP layer.
type Options struct {
	// SecureCookie marks the session cookie Secure. Turn it on when the app is served over HTTPS.
	SecureCookie bool
}

type server struct {
	pool    *pgxpool.Pool
	queries *database.Queries
	opts    Options
}

// New builds the Fiber app with every route under /api.
func New(pool *pgxpool.Pool, opts Options) *fiber.App {
	s := &server{pool: pool, queries: database.New(pool), opts: opts}
	app := fiber.New(fiber.Config{
		AppName:      "planner-api",
		ErrorHandler: handleError,
	})
	app.Use(recover.New())

	api := app.Group("/api")

	// Public routes.
	api.Get("/health", s.health)
	api.Post("/session", signInLimiter(), s.signIn)
	api.Delete("/session", s.signOut)

	// Everything registered below needs a session (D19), and so does every
	// unknown path: a signed-out request learns nothing about which routes exist.
	owned := api.Group("", s.requireOwner)
	owned.Get("/session", s.currentOwner)

	return app
}

func (s *server) health(c fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(c.Context(), 2*time.Second)
	defer cancel()
	if err := s.pool.Ping(ctx); err != nil {
		return &Error{Status: fiber.StatusServiceUnavailable, Code: "database_unavailable", Message: "database is unreachable"}
	}
	return c.JSON(fiber.Map{"status": "ok"})
}
