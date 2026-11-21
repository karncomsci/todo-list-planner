package httpapi

import (
	"fmt"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/gofiber/fiber/v3"
	"github.com/jackc/pgx/v5/pgtype"

	"planner-api/internal/database"
)

const (
	dateLayout    = "2006-01-02"
	maxNameLength = 200
	maxNoteLength = 2000
	maxRecent     = 50
)

// Task is a Task as the API returns it. Status and IsOverdue are derived on read (D21, D23).
type Task struct {
	ID          int64      `json:"id"`
	Name        string     `json:"name"`
	DueDate     string     `json:"dueDate"`
	StartDate   *string    `json:"startDate"`
	StartTime   *string    `json:"startTime"`
	EndTime     *string    `json:"endTime"`
	Priority    string     `json:"priority"`
	Progress    int        `json:"progress"`
	Status      string     `json:"status"`
	IsOverdue   bool       `json:"isOverdue"`
	Note        string     `json:"note"`
	CompletedAt *time.Time `json:"completedAt"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

// statusOf derives Status from Progress: 0 not started, 1–99 in progress, 100 done (D21).
func statusOf(progress int) string {
	switch {
	case progress >= 100:
		return "done"
	case progress > 0:
		return "in_progress"
	default:
		return "not_started"
	}
}

// isOverdue: the due date has passed and the Task is not done. A Task due today
// is not overdue until the next day begins in Thailand, whatever its time (D23, A5).
func isOverdue(dueDate time.Time, progress int, today string) bool {
	return progress < 100 && dueDate.Format(dateLayout) < today
}

func (s *server) toTask(t database.Task, today string) Task {
	progress := int(t.Progress)
	return Task{
		ID:          t.ID,
		Name:        t.Name,
		DueDate:     t.DueDate.Format(dateLayout),
		StartDate:   formatDate(t.StartDate),
		StartTime:   formatTime(t.StartTime),
		EndTime:     formatTime(t.EndTime),
		Priority:    t.Priority,
		Progress:    progress,
		Status:      statusOf(progress),
		IsOverdue:   isOverdue(t.DueDate, progress, today),
		Note:        t.Note,
		CompletedAt: t.CompletedAt,
		CreatedAt:   t.CreatedAt,
		UpdatedAt:   t.UpdatedAt,
	}
}

func formatDate(d *time.Time) *string {
	if d == nil {
		return nil
	}
	s := d.Format(dateLayout)
	return &s
}

func formatTime(t pgtype.Time) *string {
	if !t.Valid {
		return nil
	}
	minutes := t.Microseconds / int64(time.Minute/time.Microsecond)
	s := fmt.Sprintf("%02d:%02d", minutes/60, minutes%60)
	return &s
}

// parseDate reads a required CE date (D9).
func parseDate(field, value string) (time.Time, error) {
	if value == "" {
		return time.Time{}, validation(field, "required", field+" is required")
	}
	d, err := time.Parse(dateLayout, value)
	if err != nil {
		return time.Time{}, validation(field, "invalid_date", field+" must be a date in YYYY-MM-DD")
	}
	return d, nil
}

// parseOptionalDate reads a CE date that may be absent (null or "").
func parseOptionalDate(field string, value *string) (*time.Time, error) {
	if value == nil || *value == "" {
		return nil, nil
	}
	d, err := parseDate(field, *value)
	if err != nil {
		return nil, err
	}
	return &d, nil
}

// parseClock reads an optional time of day "HH:MM".
func parseClock(field string, value *string) (pgtype.Time, error) {
	if value == nil || *value == "" {
		return pgtype.Time{}, nil
	}
	t, err := time.Parse("15:04", *value)
	if err != nil || len(*value) != 5 {
		return pgtype.Time{}, validation(field, "invalid_time", field+" must be a time in HH:MM")
	}
	minutes := int64(t.Hour()*60 + t.Minute())
	return pgtype.Time{Microseconds: minutes * int64(time.Minute/time.Microsecond), Valid: true}, nil
}

// parseName trims a Task name and checks it is present and not too long.
func parseName(value string) (string, error) {
	name := strings.TrimSpace(value)
	if name == "" {
		return "", validation("name", "required", "name is required")
	}
	if utf8.RuneCountInString(name) > maxNameLength {
		return "", validation("name", "too_long", fmt.Sprintf("name must be at most %d characters", maxNameLength))
	}
	return name, nil
}

// taskRequest is the body of create (and, from ticket 07, update).
// Only name and dueDate are required.
type taskRequest struct {
	Name      string  `json:"name"`
	DueDate   string  `json:"dueDate"`
	StartDate *string `json:"startDate"`
	StartTime *string `json:"startTime"`
	EndTime   *string `json:"endTime"`
	Priority  *string `json:"priority"`
	Progress  *int    `json:"progress"`
	Note      *string `json:"note"`
}

// taskFields are the validated values of a taskRequest.
type taskFields struct {
	name      string
	dueDate   time.Time
	startDate *time.Time
	startTime pgtype.Time
	endTime   pgtype.Time
	priority  string
	progress  int
	note      string
}

// validate applies every Task rule (D20, A1) and names the first field that breaks one (D15).
func (r taskRequest) validate() (taskFields, error) {
	var f taskFields
	var err error
	if f.name, err = parseName(r.Name); err != nil {
		return f, err
	}
	if f.dueDate, err = parseDate("dueDate", r.DueDate); err != nil {
		return f, err
	}
	if f.startDate, err = parseOptionalDate("startDate", r.StartDate); err != nil {
		return f, err
	}
	if f.startDate != nil && f.startDate.After(f.dueDate) {
		return f, validation("startDate", "start_after_due", "startDate must not be after dueDate")
	}

	if f.startTime, err = parseClock("startTime", r.StartTime); err != nil {
		return f, err
	}
	if f.endTime, err = parseClock("endTime", r.EndTime); err != nil {
		return f, err
	}
	// A timed Task has both times (A1).
	switch {
	case f.startTime.Valid && !f.endTime.Valid:
		return f, validation("endTime", "required", "endTime is required with startTime")
	case f.endTime.Valid && !f.startTime.Valid:
		return f, validation("startTime", "required", "startTime is required with endTime")
	}
	// Within one day the end comes after the start. Across days the start time
	// belongs to the start date and the end time to the due date, so any pair is fine.
	oneDay := f.startDate == nil || f.startDate.Equal(f.dueDate)
	if f.startTime.Valid && oneDay && f.endTime.Microseconds <= f.startTime.Microseconds {
		return f, validation("endTime", "end_before_start", "endTime must be after startTime")
	}

	f.priority = "medium"
	if r.Priority != nil {
		switch *r.Priority {
		case "high", "medium", "low":
			f.priority = *r.Priority
		default:
			return f, validation("priority", "invalid_choice", "priority must be high, medium or low")
		}
	}

	if r.Progress != nil {
		if *r.Progress < 0 || *r.Progress > 100 {
			return f, validation("progress", "out_of_range", "progress must be from 0 to 100")
		}
		f.progress = *r.Progress
	}

	if r.Note != nil {
		f.note = strings.TrimSpace(*r.Note)
		if utf8.RuneCountInString(f.note) > maxNoteLength {
			return f, validation("note", "too_long", fmt.Sprintf("note must be at most %d characters", maxNoteLength))
		}
	}
	return f, nil
}

// completedAt is set when Progress reaches 100 and empty below (D22).
func completedAt(progress int, now time.Time) *time.Time {
	if progress < 100 {
		return nil
	}
	return &now
}

func (s *server) createTask(c fiber.Ctx) error {
	var req taskRequest
	if err := c.Bind().JSON(&req); err != nil {
		return errBadJSON
	}
	f, err := req.validate()
	if err != nil {
		return err
	}

	row, err := s.queries.CreateTask(c.Context(), database.CreateTaskParams{
		OwnerID:     currentOwnerOf(c).ID,
		Name:        f.name,
		DueDate:     f.dueDate,
		StartDate:   f.startDate,
		StartTime:   f.startTime,
		EndTime:     f.endTime,
		Priority:    f.priority,
		Progress:    int16(f.progress),
		Note:        f.note,
		CompletedAt: completedAt(f.progress, s.opts.Now()),
	})
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"task": s.toTask(row, s.today())})
}

// listTasks lists the Owner's Tasks. With ?recent=N it returns the N most
// recently changed Tasks, newest first.
func (s *server) listTasks(c fiber.Ctx) error {
	raw := c.Query("recent")
	if raw == "" {
		return validation("recent", "required", "recent is required")
	}
	n, err := strconv.Atoi(raw)
	if err != nil || n < 1 || n > maxRecent {
		return validation("recent", "out_of_range", fmt.Sprintf("recent must be a whole number from 1 to %d", maxRecent))
	}

	rows, err := s.queries.ListRecentTasks(c.Context(), database.ListRecentTasksParams{
		OwnerID: currentOwnerOf(c).ID,
		MaxRows: int32(n),
	})
	if err != nil {
		return err
	}
	today := s.today()
	tasks := make([]Task, len(rows))
	for i, row := range rows {
		tasks[i] = s.toTask(row, today)
	}
	return c.JSON(fiber.Map{"tasks": tasks})
}
