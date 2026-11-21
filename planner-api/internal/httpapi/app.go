// Package httpapi is the HTTP boundary of the API: routes, handlers and the error shape.
package httpapi

import (
	"context"
	"time"
	_ "time/tzdata" // Asia/Bangkok must load in a minimal container image

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/recover"
	"github.com/jackc/pgx/v5/pgxpool"

	"planner-api/internal/database"
)

// Options are the deployment settings of the HTTP layer.
type Options struct {
	// SecureCookie marks the session cookie Secure. Turn it on when the app is served over HTTPS.
	SecureCookie bool
	// Now is the clock; tests set it to pin "today". Defaults to time.Now.
	Now func() time.Time
}

type server struct {
	pool    *pgxpool.Pool
	queries *database.Queries
	opts    Options
}

// thailand is the one time zone of the system (D9).
var thailand = func() *time.Location {
	loc, err := time.LoadLocation("Asia/Bangkok")
	if err != nil {
		panic(err)
	}
	return loc
}()

// today is the current date in Thailand, as YYYY-MM-DD.
func (s *server) today() string {
	return s.opts.Now().In(thailand).Format(dateLayout)
}

// New builds the Fiber app with every route under /api.
func New(pool *pgxpool.Pool, opts Options) *fiber.App {
	if opts.Now == nil {
		opts.Now = time.Now
	}
	s := &server{pool: pool, queries: database.New(pool), opts: opts}
	app := fiber.New(fiber.Config{
		AppName:      "planner-api",
		ErrorHandler: handleError,
		// A backup import carries all of an Owner's data in one request (D34).
		BodyLimit: 32 * 1024 * 1024,
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
	owned.Put("/password", s.changePassword)
	owned.Get("/tasks", s.listTasks)
	owned.Post("/tasks", s.createTask)
	owned.Get("/tasks/:id", s.getTask)
	owned.Put("/tasks/:id", s.updateTask)
	owned.Delete("/tasks/:id", s.deleteTask)
	owned.Get("/categories", s.listCategories)
	owned.Post("/categories", s.createCategory)
	owned.Put("/categories/:id", s.renameCategory)
	owned.Delete("/categories/:id", s.deleteCategory)
	owned.Get("/overview", s.overview)
	owned.Get("/routine", s.getRoutine)
	owned.Put("/routine", s.saveRoutine)
	owned.Delete("/routine", s.clearRoutine)
	owned.Get("/checklists/:date", s.getChecklist)
	owned.Put("/checklists/:date", s.saveChecklist)
	owned.Get("/settings", s.getSettings)
	owned.Put("/settings", s.saveSettings)
	owned.Get("/reports", s.reports)
	owned.Get("/backup", s.exportBackup)
	owned.Post("/backup", s.importBackup)

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
