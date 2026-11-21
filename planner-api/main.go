// Command planner-api serves the Task Calendar Planner REST API.
package main

import (
	"context"
	"errors"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gofiber/fiber/v3"

	"planner-api/internal/auth"
	"planner-api/internal/database"
	"planner-api/internal/httpapi"
)

func main() {
	if err := run(); err != nil {
		slog.Error("api stopped", "error", err)
		os.Exit(1)
	}
}

func run() error {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		return errors.New("DATABASE_URL is required")
	}
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	pool, err := database.Connect(ctx, databaseURL)
	if err != nil {
		return err
	}
	defer pool.Close()

	if err := database.Migrate(ctx, pool); err != nil {
		return err
	}

	created, err := auth.EnsureOwner(ctx, database.New(pool), os.Getenv("OWNER_EMAIL"), os.Getenv("OWNER_PASSWORD"))
	if err != nil {
		return err
	}
	if created {
		slog.Info("created the Owner from OWNER_EMAIL and OWNER_PASSWORD")
	}

	app := httpapi.New(pool, httpapi.Options{SecureCookie: os.Getenv("COOKIE_SECURE") == "true"})
	slog.Info("api listening", "port", port)
	return app.Listen(":"+port, fiber.ListenConfig{
		GracefulContext:       ctx,
		ShutdownTimeout:       10 * time.Second,
		DisableStartupMessage: true,
	})
}
