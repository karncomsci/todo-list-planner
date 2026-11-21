package httpapi

import (
	"cmp"
	"fmt"
	"slices"
	"strings"
	"time"

	"github.com/gofiber/fiber/v3"

	"planner-api/internal/database"
)

// parseRange reads ?from=&to=, CE dates with both ends inclusive, at most
// maxRangeDays long. Listing Tasks by range and Reports share these rules.
func parseRange(c fiber.Ctx) (from, to time.Time, err error) {
	if from, err = parseDate("from", c.Query("from")); err != nil {
		return
	}
	if to, err = parseDate("to", c.Query("to")); err != nil {
		return
	}
	if to.Before(from) {
		err = validation("to", "out_of_range", "to must not be before from")
		return
	}
	if to.Sub(from) > maxRangeDays*24*time.Hour {
		err = validation("to", "out_of_range", fmt.Sprintf("the range must be at most %d days", maxRangeDays))
	}
	return
}

// WeekCount is the number of Tasks completed in one Monday-start week.
type WeekCount struct {
	// WeekStart is the week's Monday, YYYY-MM-DD.
	WeekStart string `json:"weekStart"`
	Count     int64  `json:"count"`
}

// OnTime splits the settled Tasks due in the range (story 50, A6).
type OnTime struct {
	OnTime  int64 `json:"onTime"`
	Late    int64 `json:"late"`
	NotDone int64 `json:"notDone"`
	// Share is OnTime over all settled Tasks, from 0 to 1; null when none are settled.
	Share *float64 `json:"share"`
}

// Water is the average glasses per day over the range's days up to today (story 53).
type Water struct {
	AverageGlasses *float64 `json:"averageGlasses"`
	Days           int      `json:"days"`
}

// Report holds the six Reports metrics for a range (D31), all calculated here (D32).
type Report struct {
	From             string           `json:"from"`
	To               string           `json:"to"`
	Total            int64            `json:"total"`
	CompletedPerWeek []WeekCount      `json:"completedPerWeek"`
	OnTime           OnTime           `json:"onTime"`
	ByCategory       []CategoryCount  `json:"byCategory"`
	ByPriority       map[string]int64 `json:"byPriority"`
	Overdue          int64            `json:"overdue"`
	Water            Water            `json:"water"`
	AllMealsDays     int64            `json:"allMealsDays"`
}

// mondayOf is the Monday of the week holding day (weeks start on Monday, D9).
func mondayOf(day time.Time) time.Time {
	return day.AddDate(0, 0, -((int(day.Weekday()) + 6) % 7))
}

// reports answers the six metrics for ?from=&to= (D31, stories 48 to 53).
func (s *server) reports(c fiber.Ctx) error {
	from, to, err := parseRange(c)
	if err != nil {
		return err
	}
	owner := currentOwnerOf(c).ID
	todayText := s.today()
	today, err := time.Parse(dateLayout, todayText)
	if err != nil {
		return err
	}
	report := Report{
		From:       from.Format(dateLayout),
		To:         to.Format(dateLayout),
		ByCategory: []CategoryCount{},
		ByPriority: map[string]int64{"high": 0, "medium": 0, "low": 0},
	}

	// Tasks completed per week: every week touching the range, zeros included.
	completions, err := s.queries.ListCompletionDays(c.Context(), database.ListCompletionDaysParams{OwnerID: owner, FromDate: from, ToDate: to})
	if err != nil {
		return err
	}
	perWeek := map[string]int64{}
	for _, row := range completions {
		perWeek[mondayOf(row.Day).Format(dateLayout)] += row.Completed
	}
	report.CompletedPerWeek = []WeekCount{}
	for week := mondayOf(from); !week.After(to); week = week.AddDate(0, 0, 7) {
		key := week.Format(dateLayout)
		report.CompletedPerWeek = append(report.CompletedPerWeek, WeekCount{WeekStart: key, Count: perWeek[key]})
	}

	// The Tasks due in the range: on time, by Category, by Priority, Overdue.
	tasks, err := s.queries.ListTasksDueInRange(c.Context(), database.ListTasksDueInRangeParams{OwnerID: owner, FromDate: from, ToDate: to})
	if err != nil {
		return err
	}
	type categoryKey struct {
		id   int64
		name string
	}
	perCategory := map[categoryKey]int64{}
	var uncategorised int64
	for _, task := range tasks {
		report.Total++
		report.ByPriority[task.Priority]++
		if task.CategoryID != nil && task.CategoryName != nil {
			perCategory[categoryKey{*task.CategoryID, *task.CategoryName}]++
		} else {
			uncategorised++
		}
		due := task.DueDate.Format(dateLayout)
		switch {
		case task.Progress >= 100 && task.CompletedAt != nil:
			if task.CompletedAt.In(thailand).Format(dateLayout) <= due {
				report.OnTime.OnTime++
			} else {
				report.OnTime.Late++
			}
		case isOverdue(task.DueDate, int(task.Progress), todayText):
			report.OnTime.NotDone++
			report.Overdue++
		}
	}
	if settled := report.OnTime.OnTime + report.OnTime.Late + report.OnTime.NotDone; settled > 0 {
		share := float64(report.OnTime.OnTime) / float64(settled)
		report.OnTime.Share = &share
	}
	for key, count := range perCategory {
		report.ByCategory = append(report.ByCategory, CategoryCount{Category: &Category{ID: key.id, Name: key.name}, Count: count})
	}
	slices.SortFunc(report.ByCategory, func(a, b CategoryCount) int {
		return cmp.Or(
			cmp.Compare(b.Count, a.Count),
			strings.Compare(strings.ToLower(a.Category.Name), strings.ToLower(b.Category.Name)),
			cmp.Compare(a.Category.ID, b.Category.ID),
		)
	})
	if uncategorised > 0 {
		report.ByCategory = append(report.ByCategory, CategoryCount{Category: nil, Count: uncategorised})
	}

	// Water and meals: the range's days up to today; a day without a record is empty (D27).
	last := to
	if today.Before(last) {
		last = today
	}
	if !from.After(last) {
		checklists, err := s.queries.ListChecklistsInRange(c.Context(), database.ListChecklistsInRangeParams{OwnerID: owner, FromDate: from, ToDate: last})
		if err != nil {
			return err
		}
		var glasses int64
		for _, day := range checklists {
			glasses += int64(day.Glasses)
			if day.BreakfastDone && day.LunchDone && day.DinnerDone {
				report.AllMealsDays++
			}
		}
		report.Water.Days = int(last.Sub(from).Hours()/24) + 1
		average := float64(glasses) / float64(report.Water.Days)
		report.Water.AverageGlasses = &average
	}

	return c.JSON(fiber.Map{"report": report})
}
