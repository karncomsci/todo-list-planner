package httpapi

import (
	"time"

	"github.com/gofiber/fiber/v3"

	"planner-api/internal/database"
	"planner-api/internal/planner"
)

// MonthSummary is this month's summary on the Overview: the Owner's Tasks due
// in the month, by Status, and those of them Overdue now (D30, story 38).
type MonthSummary struct {
	// Month is the current month in Thailand, YYYY-MM (CE).
	Month      string `json:"month"`
	Total      int64  `json:"total"`
	Done       int64  `json:"done"`
	InProgress int64  `json:"inProgress"`
	Overdue    int64  `json:"overdue"`
	// ByStatus counts the same Tasks per Status; every Status is present (D21).
	ByStatus map[string]int64 `json:"byStatus"`
	// ByCategory counts the same Tasks per Category, largest first, with the
	// uncategorised Tasks last as one entry whose Category is null (D24).
	ByCategory []CategoryCount `json:"byCategory"`
}

// CategoryCount is one Category's share of this month's Tasks.
type CategoryCount struct {
	// Category is null for the Tasks that have none.
	Category *Category `json:"category"`
	Count    int64     `json:"count"`
}

// overview answers the Overview: the current state only (D30). Every number
// and list on that page is calculated here, never in the front end (D32).
func (s *server) overview(c fiber.Ctx) error {
	owner := currentOwnerOf(c).ID
	today := s.today()
	day, err := time.Parse(planner.DateLayout, today)
	if err != nil {
		return err
	}

	// Today's Tasks are those whose span covers today: a one-day range.
	rows, err := s.queries.ListTasksInRange(c.Context(), database.ListTasksInRangeParams{OwnerID: owner, FromDate: day, ToDate: day})
	if err != nil {
		return err
	}
	todayTasks := []Task{}
	for _, row := range rows {
		todayTasks = append(todayTasks, s.toTask(row.Task, row.CategoryName, today))
	}

	// Every Overdue Task, however old (D23, story 37).
	overdueRows, err := s.queries.ListOverdueTasks(c.Context(), database.ListOverdueTasksParams{OwnerID: owner, Today: day})
	if err != nil {
		return err
	}
	overdueTasks := []Task{}
	for _, row := range overdueRows {
		overdueTasks = append(overdueTasks, s.toTask(row.Task, row.CategoryName, today))
	}

	// This month: the Tasks due from the 1st up to the 1st of next month.
	monthStart := time.Date(day.Year(), day.Month(), 1, 0, 0, 0, 0, time.UTC)
	nextMonthStart := monthStart.AddDate(0, 1, 0)
	counts, err := s.queries.CountMonthTasks(c.Context(), database.CountMonthTasksParams{
		OwnerID:        owner,
		Today:          day,
		MonthStart:     monthStart,
		NextMonthStart: nextMonthStart,
	})
	if err != nil {
		return err
	}
	categoryRows, err := s.queries.CountMonthTasksByCategory(c.Context(), database.CountMonthTasksByCategoryParams{
		OwnerID:        owner,
		MonthStart:     monthStart,
		NextMonthStart: nextMonthStart,
	})
	if err != nil {
		return err
	}
	byCategory := []CategoryCount{}
	for _, row := range categoryRows {
		var category *Category
		if row.CategoryID != nil && row.CategoryName != nil {
			category = &Category{ID: *row.CategoryID, Name: *row.CategoryName}
		}
		byCategory = append(byCategory, CategoryCount{Category: category, Count: row.TaskCount})
	}

	month := MonthSummary{
		Month:      monthStart.Format("2006-01"),
		Total:      counts.Total,
		Done:       counts.Done,
		InProgress: counts.InProgress,
		Overdue:    counts.Overdue,
		ByStatus: map[string]int64{
			planner.StatusNotStarted: counts.Total - counts.InProgress - counts.Done,
			planner.StatusInProgress: counts.InProgress,
			planner.StatusDone:       counts.Done,
		},
		ByCategory: byCategory,
	}

	return c.JSON(fiber.Map{
		"today":        today,
		"todayTasks":   todayTasks,
		"overdueTasks": overdueTasks,
		"month":        month,
	})
}
