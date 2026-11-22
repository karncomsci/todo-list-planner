// Package planner holds the planner's domain rules that depend on neither HTTP
// nor SQL: the day in Thailand, a Task's Status, Overdue, and its completed-at
// time. The HTTP layer uses them, and so will any background job.
package planner

import (
	"time"
	_ "time/tzdata" // Asia/Bangkok must load in a minimal container image
)

// DateLayout is the one form of a date the system reads and writes: CE, YYYY-MM-DD (D9).
const DateLayout = "2006-01-02"

// Thailand is the one time zone of the system (D9).
var Thailand = func() *time.Location {
	loc, err := time.LoadLocation("Asia/Bangkok")
	if err != nil {
		panic(err)
	}
	return loc
}()

// DateOf is the date in Thailand at instant t, as YYYY-MM-DD.
func DateOf(t time.Time) string {
	return t.In(Thailand).Format(DateLayout)
}

// Task Statuses (D21).
const (
	StatusNotStarted = "not_started"
	StatusInProgress = "in_progress"
	StatusDone       = "done"
)

// StatusOf derives Status from Progress: 0 not started, 1–99 in progress, 100 done (D21).
func StatusOf(progress int) string {
	switch {
	case progress >= 100:
		return StatusDone
	case progress > 0:
		return StatusInProgress
	default:
		return StatusNotStarted
	}
}

// IsOverdue: the due date has passed and the Task is not done. A Task due today
// is not overdue until the next day begins in Thailand, whatever its time (D23, A5).
// today is DateOf(now).
func IsOverdue(dueDate time.Time, progress int, today string) bool {
	return progress < 100 && dueDate.Format(DateLayout) < today
}

// CompletedAt is set when Progress reaches 100 and empty below (D22).
func CompletedAt(progress int, now time.Time) *time.Time {
	if progress < 100 {
		return nil
	}
	return &now
}
