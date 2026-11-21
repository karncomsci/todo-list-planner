package httpapi

import (
	"errors"
	"fmt"
	"strings"
	"unicode/utf8"

	"github.com/gofiber/fiber/v3"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"

	"planner-api/internal/database"
)

const maxCategoryNameLength = 50

// Category is a Category as the API returns it (D24).
type Category struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
}

func toCategory(c database.Category) Category {
	return Category{ID: c.ID, Name: c.Name}
}

// listCategories lists the Owner's Categories by name.
func (s *server) listCategories(c fiber.Ctx) error {
	rows, err := s.queries.ListCategories(c.Context(), currentOwnerOf(c).ID)
	if err != nil {
		return err
	}
	categories := make([]Category, len(rows))
	for i, row := range rows {
		categories[i] = toCategory(row)
	}
	return c.JSON(fiber.Map{"categories": categories})
}

// createCategory adds a Category. Names are unique per Owner, ignoring letter case (D24).
func (s *server) createCategory(c fiber.Ctx) error {
	var req struct {
		Name string `json:"name"`
	}
	if err := c.Bind().JSON(&req); err != nil {
		return errBadJSON
	}
	name := strings.TrimSpace(req.Name)
	if name == "" {
		return validation("name", "required", "name is required")
	}
	if utf8.RuneCountInString(name) > maxCategoryNameLength {
		return validation("name", "too_long", fmt.Sprintf("name must be at most %d characters", maxCategoryNameLength))
	}

	row, err := s.queries.CreateCategory(c.Context(), database.CreateCategoryParams{
		OwnerID: currentOwnerOf(c).ID,
		Name:    name,
	})
	// The unique index decides, so two saves at once cannot both pass.
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23505" && pgErr.ConstraintName == "categories_owner_name_key" {
		return validation("name", "duplicate", "a Category with this name already exists")
	}
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"category": toCategory(row)})
}

// ownCategory finds the Owner's Category for a Task. Another Owner's Category
// is as unknown as a missing one (D19).
func (s *server) ownCategory(c fiber.Ctx, id *int64) (*Category, error) {
	if id == nil {
		return nil, nil
	}
	row, err := s.queries.GetCategory(c.Context(), database.GetCategoryParams{ID: *id, OwnerID: currentOwnerOf(c).ID})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, validation("categoryId", "invalid_choice", "categoryId is not one of your Categories")
	}
	if err != nil {
		return nil, err
	}
	category := toCategory(row)
	return &category, nil
}
