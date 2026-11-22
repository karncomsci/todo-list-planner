// Command planner-api serves the Task Calendar Planner REST API.
package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"github.com/gofiber/fiber/v3"

	"planner-api/internal/auth"
	"planner-api/internal/config"
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

	cfg, err := config.Load(os.Getenv)
	if err != nil {
		return err
	}

	pool, err := database.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		return err
	}
	defer pool.Close()

	if err := database.Migrate(ctx, pool); err != nil {
		return err
	}

	created, err := auth.EnsureOwner(ctx, database.New(pool), cfg.OwnerEmail, cfg.OwnerPassword)
	if err != nil {
		return err
	}
	if created {
		slog.Info("created the Owner from OWNER_EMAIL and OWNER_PASSWORD")
	}

	app := httpapi.New(pool, httpapi.Options{SecureCookie: cfg.SecureCookie})
	slog.Info("api listening", "port", cfg.Port)
	return app.Listen(":"+strconv.Itoa(cfg.Port), fiber.ListenConfig{
		GracefulContext:       ctx,
		ShutdownTimeout:       10 * time.Second,
		DisableStartupMessage: true,
	})
}
