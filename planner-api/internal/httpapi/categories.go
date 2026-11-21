package httpapi

import (
	"errors"
	"fmt"
	"strconv"
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

// readCategoryName reads and checks the name in a create or rename body.
func readCategoryName(c fiber.Ctx) (string, error) {
	var req struct {
		Name string `json:"name"`
	}
	if err := c.Bind().JSON(&req); err != nil {
		return "", errBadJSON
	}
	name := strings.TrimSpace(req.Name)
	if name == "" {
		return "", validation("name", "required", "name is required")
	}
	if utf8.RuneCountInString(name) > maxCategoryNameLength {
		return "", validation("name", "too_long", fmt.Sprintf("name must be at most %d characters", maxCategoryNameLength))
	}
	return name, nil
}

// duplicateName turns the unique-name index refusing a save into a validation
// error. The index decides, so two saves at once cannot both pass (D24).
func duplicateName(err error) error {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23505" && pgErr.ConstraintName == "categories_owner_name_key" {
		return validation("name", "duplicate", "a Category with this name already exists")
	}
	return err
}

// createCategory adds a Category. Names are unique per Owner, ignoring letter case (D24).
func (s *server) createCategory(c fiber.Ctx) error {
	name, err := readCategoryName(c)
	if err != nil {
		return err
	}
	row, err := s.queries.CreateCategory(c.Context(), database.CreateCategoryParams{
		OwnerID: currentOwnerOf(c).ID,
		Name:    name,
	})
	if err != nil {
		return duplicateName(err)
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"category": toCategory(row)})
}

var errCategoryNotFound = &Error{Status: fiber.StatusNotFound, Code: "not_found", Message: "no such Category"}

func categoryID(c fiber.Ctx) (int64, error) {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil || id < 1 {
		return 0, errCategoryNotFound
	}
	return id, nil
}

// renameCategory renames one of the Owner's Categories (story 55).
func (s *server) renameCategory(c fiber.Ctx) error {
	id, err := categoryID(c)
	if err != nil {
		return err
	}
	name, err := readCategoryName(c)
	if err != nil {
		return err
	}
	row, err := s.queries.RenameCategory(c.Context(), database.RenameCategoryParams{ID: id, OwnerID: currentOwnerOf(c).ID, Name: name})
	if errors.Is(err, pgx.ErrNoRows) {
		return errCategoryNotFound
	}
	if err != nil {
		return duplicateName(err)
	}
	return c.JSON(fiber.Map{"category": toCategory(row)})
}

// deleteCategory deletes one of the Owner's Categories; its Tasks stay,
// uncategorised (D24, story 56).
func (s *server) deleteCategory(c fiber.Ctx) error {
	id, err := categoryID(c)
	if err != nil {
		return err
	}
	n, err := s.queries.DeleteCategory(c.Context(), database.DeleteCategoryParams{ID: id, OwnerID: currentOwnerOf(c).ID})
	if err != nil {
		return err
	}
	if n == 0 {
		return errCategoryNotFound
	}
	return c.SendStatus(fiber.StatusNoContent)
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
