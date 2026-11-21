package httpapi

import (
	"errors"
	"fmt"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/gofiber/fiber/v3"
	"github.com/jackc/pgx/v5"

	"planner-api/internal/database"
)

const (
	maxGlasses        = 30
	maxMealMenuLength = 100
	maxReminderLength = 1000
)

// Checklist is one day's Daily Checklist (D27): glasses of water, three meals
// each with a menu and a tick, and the Reminder Note.
type Checklist struct {
	Date          string `json:"date"`
	Glasses       int    `json:"glasses"`
	BreakfastMenu string `json:"breakfastMenu"`
	BreakfastDone bool   `json:"breakfastDone"`
	LunchMenu     string `json:"lunchMenu"`
	LunchDone     bool   `json:"lunchDone"`
	DinnerMenu    string `json:"dinnerMenu"`
	DinnerDone    bool   `json:"dinnerDone"`
	Note          string `json:"note"`
}

func toChecklist(row database.DailyChecklist) Checklist {
	return Checklist{
		Date:          row.Day.Format(dateLayout),
		Glasses:       int(row.Glasses),
		BreakfastMenu: row.BreakfastMenu,
		BreakfastDone: row.BreakfastDone,
		LunchMenu:     row.LunchMenu,
		LunchDone:     row.LunchDone,
		DinnerMenu:    row.DinnerMenu,
		DinnerDone:    row.DinnerDone,
		Note:          row.Note,
	}
}

// checklistDate reads the CE date in the path.
func checklistDate(c fiber.Ctx) (time.Time, error) {
	return parseDate("date", c.Params("date"))
}

// getChecklist answers one day's checklist; a day with no record is empty (D27).
func (s *server) getChecklist(c fiber.Ctx) error {
	day, err := checklistDate(c)
	if err != nil {
		return err
	}
	row, err := s.queries.GetDailyChecklist(c.Context(), database.GetDailyChecklistParams{OwnerID: currentOwnerOf(c).ID, Day: day})
	if errors.Is(err, pgx.ErrNoRows) {
		return c.JSON(fiber.Map{"checklist": Checklist{Date: day.Format(dateLayout)}})
	}
	if err != nil {
		return err
	}
	return c.JSON(fiber.Map{"checklist": toChecklist(row)})
}

// saveChecklist creates or replaces one day's checklist with every field given.
func (s *server) saveChecklist(c fiber.Ctx) error {
	day, err := checklistDate(c)
	if err != nil {
		return err
	}
	var req Checklist
	if err := c.Bind().JSON(&req); err != nil {
		return errBadJSON
	}
	if req.Glasses < 0 || req.Glasses > maxGlasses {
		return validation("glasses", "out_of_range", fmt.Sprintf("glasses must be 0 to %d", maxGlasses))
	}
	texts := []struct {
		field string
		value *string
		max   int
	}{
		{"breakfastMenu", &req.BreakfastMenu, maxMealMenuLength},
		{"lunchMenu", &req.LunchMenu, maxMealMenuLength},
		{"dinnerMenu", &req.DinnerMenu, maxMealMenuLength},
		{"note", &req.Note, maxReminderLength},
	}
	for _, t := range texts {
		*t.value = strings.TrimSpace(*t.value)
		if utf8.RuneCountInString(*t.value) > t.max {
			return validation(t.field, "too_long", fmt.Sprintf("%s must be at most %d characters", t.field, t.max))
		}
	}

	row, err := s.queries.SaveDailyChecklist(c.Context(), database.SaveDailyChecklistParams{
		OwnerID:       currentOwnerOf(c).ID,
		Day:           day,
		Glasses:       int16(req.Glasses),
		BreakfastMenu: req.BreakfastMenu,
		BreakfastDone: req.BreakfastDone,
		LunchMenu:     req.LunchMenu,
		LunchDone:     req.LunchDone,
		DinnerMenu:    req.DinnerMenu,
		DinnerDone:    req.DinnerDone,
		Note:          req.Note,
	})
	if err != nil {
		return err
	}
	return c.JSON(fiber.Map{"checklist": toChecklist(row)})
}

// Settings are the Owner's settings (D28).
type Settings struct {
	WaterGoal int `json:"waterGoal"`
}

// getSettings answers the Owner's settings, with the defaults where never saved.
func (s *server) getSettings(c fiber.Ctx) error {
	goal, err := s.queries.GetWaterGoal(c.Context(), currentOwnerOf(c).ID)
	if err != nil {
		return err
	}
	return c.JSON(fiber.Map{"settings": Settings{WaterGoal: int(goal)}})
}
