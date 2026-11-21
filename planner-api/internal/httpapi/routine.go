package httpapi

import (
	"fmt"
	"strings"
	"unicode/utf8"

	"github.com/gofiber/fiber/v3"

	"planner-api/internal/database"
)

const (
	firstRoutineHour      = 5
	lastRoutineHour       = 23
	maxRoutineEntryLength = 200
)

// RoutineEntry is one hour of the Routine (D26). Text is "" for an empty hour.
type RoutineEntry struct {
	Hour int    `json:"hour"`
	Text string `json:"text"`
}

// routineOf answers every hour from 05:00 to 23:00, empty where nothing is stored.
func (s *server) routineOf(c fiber.Ctx, owner int64) ([]RoutineEntry, error) {
	rows, err := s.queries.ListRoutineEntries(c.Context(), owner)
	if err != nil {
		return nil, err
	}
	entries := make([]RoutineEntry, 0, lastRoutineHour-firstRoutineHour+1)
	for hour := firstRoutineHour; hour <= lastRoutineHour; hour++ {
		entries = append(entries, RoutineEntry{Hour: hour})
	}
	for _, row := range rows {
		entries[int(row.Hour)-firstRoutineHour].Text = row.Text
	}
	return entries, nil
}

// getRoutine answers the Owner's Routine, all nineteen hours (story 40).
func (s *server) getRoutine(c fiber.Ctx) error {
	entries, err := s.routineOf(c, currentOwnerOf(c).ID)
	if err != nil {
		return err
	}
	return c.JSON(fiber.Map{"entries": entries})
}

// saveRoutine replaces the whole template: an hour left out, or sent empty,
// becomes empty (stories 40, 41).
func (s *server) saveRoutine(c fiber.Ctx) error {
	var req struct {
		Entries []RoutineEntry `json:"entries"`
	}
	if err := c.Bind().JSON(&req); err != nil {
		return errBadJSON
	}
	seen := map[int]bool{}
	keep := []RoutineEntry{}
	for _, entry := range req.Entries {
		if entry.Hour < firstRoutineHour || entry.Hour > lastRoutineHour || seen[entry.Hour] {
			return validation("entries", "out_of_range", fmt.Sprintf("each hour must be %d to %d and given once", firstRoutineHour, lastRoutineHour))
		}
		seen[entry.Hour] = true
		text := strings.TrimSpace(entry.Text)
		if utf8.RuneCountInString(text) > maxRoutineEntryLength {
			return validation("entries", "too_long", fmt.Sprintf("each entry must be at most %d characters", maxRoutineEntryLength))
		}
		if text != "" {
			keep = append(keep, RoutineEntry{Hour: entry.Hour, Text: text})
		}
	}

	owner := currentOwnerOf(c).ID
	if err := s.inTx(c, func(q *database.Queries) error {
		if err := q.ClearRoutine(c.Context(), owner); err != nil {
			return err
		}
		for _, entry := range keep {
			if err := q.AddRoutineEntry(c.Context(), database.AddRoutineEntryParams{OwnerID: owner, Hour: int16(entry.Hour), Text: entry.Text}); err != nil {
				return err
			}
		}
		return nil
	}); err != nil {
		return err
	}
	return s.getRoutine(c)
}

// clearRoutine empties every hour in one step (story 42).
func (s *server) clearRoutine(c fiber.Ctx) error {
	if err := s.queries.ClearRoutine(c.Context(), currentOwnerOf(c).ID); err != nil {
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// inTx runs fn in one transaction: all of its writes happen, or none do.
func (s *server) inTx(c fiber.Ctx, fn func(q *database.Queries) error) error {
	tx, err := s.pool.Begin(c.Context())
	if err != nil {
		return err
	}
	defer tx.Rollback(c.Context()) //nolint:errcheck // a no-op after Commit
	if err := fn(s.queries.WithTx(tx)); err != nil {
		return err
	}
	return tx.Commit(c.Context())
}
