package httpapi

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/gofiber/fiber/v3"

	"planner-api/internal/database"
)

const (
	backupFormat  = "planner-backup"
	backupVersion = 1
)

// Backup is every piece of one Owner's data, as one JSON file (D33). It holds
// no password and no sessions. IDs only link Tasks to Categories inside the file.
type Backup struct {
	Format     string         `json:"format"`
	Version    int            `json:"version"`
	ExportedAt time.Time      `json:"exportedAt"`
	Categories []Category     `json:"categories"`
	Tasks      []BackupTask   `json:"tasks"`
	Routine    []RoutineEntry `json:"routine"`
	Checklists []Checklist    `json:"checklists"`
	Settings   Settings       `json:"settings"`
}

// BackupTask is a Task in a backup: the fields of create and update, plus its times.
type BackupTask struct {
	taskRequest
	CompletedAt *time.Time `json:"completedAt"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

// exportBackup answers all the Owner's data as a file to download (story 58).
func (s *server) exportBackup(c fiber.Ctx) error {
	owner := currentOwnerOf(c).ID
	ctx := c.Context()
	now := s.opts.Now()
	backup := Backup{
		Format:     backupFormat,
		Version:    backupVersion,
		ExportedAt: now.UTC(),
		Categories: []Category{},
		Tasks:      []BackupTask{},
		Routine:    []RoutineEntry{},
		Checklists: []Checklist{},
	}

	categories, err := s.queries.ListCategories(ctx, owner)
	if err != nil {
		return err
	}
	for _, row := range categories {
		backup.Categories = append(backup.Categories, toCategory(row))
	}

	tasks, err := s.queries.ListAllTasks(ctx, owner)
	if err != nil {
		return err
	}
	for _, t := range tasks {
		progress := int(t.Progress)
		priority := t.Priority
		note := t.Note
		backup.Tasks = append(backup.Tasks, BackupTask{
			taskRequest: taskRequest{
				Name:       t.Name,
				DueDate:    t.DueDate.Format(dateLayout),
				StartDate:  formatDate(t.StartDate),
				StartTime:  formatTime(t.StartTime),
				EndTime:    formatTime(t.EndTime),
				Priority:   &priority,
				Progress:   &progress,
				Note:       &note,
				CategoryID: t.CategoryID,
			},
			CompletedAt: t.CompletedAt,
			CreatedAt:   t.CreatedAt,
			UpdatedAt:   t.UpdatedAt,
		})
	}

	routine, err := s.queries.ListRoutineEntries(ctx, owner)
	if err != nil {
		return err
	}
	for _, row := range routine {
		backup.Routine = append(backup.Routine, RoutineEntry{Hour: int(row.Hour), Text: row.Text})
	}

	checklists, err := s.queries.ListAllChecklists(ctx, owner)
	if err != nil {
		return err
	}
	for _, row := range checklists {
		backup.Checklists = append(backup.Checklists, toChecklist(row))
	}

	goal, err := s.queries.GetWaterGoal(ctx, owner)
	if err != nil {
		return err
	}
	backup.Settings = Settings{WaterGoal: int(goal)}

	filename := fmt.Sprintf("planner-backup-%s.json", now.In(thailand).Format(dateLayout))
	c.Set(fiber.HeaderContentDisposition, fmt.Sprintf(`attachment; filename="%s"`, filename))
	return c.JSON(backup)
}

// invalidBackup rejects a file in the wrong format; nothing is changed (D34).
func invalidBackup(where string, err error) *Error {
	message := where
	var apiErr *Error
	if errors.As(err, &apiErr) {
		message = fmt.Sprintf("%s: %s", where, apiErr.Message)
	} else if err != nil {
		message = fmt.Sprintf("%s: %s", where, err)
	}
	return &Error{Status: fiber.StatusUnprocessableEntity, Code: "invalid_backup", Message: message}
}

// importedTask is a validated Task of a backup, ready to insert.
type importedTask struct {
	fields      taskFields
	categoryRef *int64
	completedAt *time.Time
	createdAt   time.Time
	updatedAt   time.Time
}

// importBackup replaces all of the Owner's data with a backup, in one
// transaction: everything is replaced, or nothing is (D34, story 59).
func (s *server) importBackup(c fiber.Ctx) error {
	var backup Backup
	if err := c.Bind().JSON(&backup); err != nil {
		return invalidBackup("the file is not a backup", nil)
	}
	if backup.Format != backupFormat || backup.Version != backupVersion {
		return invalidBackup(fmt.Sprintf("format must be %q version %d", backupFormat, backupVersion), nil)
	}
	now := s.opts.Now()

	// Check the whole file before changing anything.
	categoryNames := map[int64]string{}
	seenNames := map[string]bool{}
	for i, category := range backup.Categories {
		name, err := cleanCategoryName(category.Name)
		if err != nil {
			return invalidBackup(fmt.Sprintf("categories[%d]", i), err)
		}
		key := strings.ToLower(name)
		if _, dup := categoryNames[category.ID]; dup || seenNames[key] {
			return invalidBackup(fmt.Sprintf("categories[%d]: the ID or name appears twice", i), nil)
		}
		categoryNames[category.ID] = name
		seenNames[key] = true
	}

	tasks := make([]importedTask, 0, len(backup.Tasks))
	for i, task := range backup.Tasks {
		where := fmt.Sprintf("tasks[%d]", i)
		fields, err := task.validate()
		if err != nil {
			return invalidBackup(where, err)
		}
		if task.CategoryID != nil {
			if _, ok := categoryNames[*task.CategoryID]; !ok {
				return invalidBackup(where+": categoryId is not a Category in the file", nil)
			}
		}
		// completedAt goes with Progress 100 and only with it (D22).
		if (fields.progress == 100) != (task.CompletedAt != nil) {
			return invalidBackup(where+": completedAt must be set exactly when progress is 100", nil)
		}
		created, updated := task.CreatedAt, task.UpdatedAt
		if created.IsZero() {
			created = now
		}
		if updated.IsZero() {
			updated = created
		}
		tasks = append(tasks, importedTask{fields: fields, categoryRef: task.CategoryID, completedAt: task.CompletedAt, createdAt: created, updatedAt: updated})
	}

	routine, err := cleanRoutine(backup.Routine)
	if err != nil {
		return invalidBackup("routine", err)
	}

	days := map[string]bool{}
	checklists := make([]Checklist, 0, len(backup.Checklists))
	dates := make([]time.Time, 0, len(backup.Checklists))
	for i, checklist := range backup.Checklists {
		where := fmt.Sprintf("checklists[%d]", i)
		day, err := parseDate("date", checklist.Date)
		if err != nil {
			return invalidBackup(where, err)
		}
		if days[checklist.Date] {
			return invalidBackup(where+": the date appears twice", nil)
		}
		days[checklist.Date] = true
		if err := checklist.clean(); err != nil {
			return invalidBackup(where, err)
		}
		checklists = append(checklists, checklist)
		dates = append(dates, day)
	}

	if backup.Settings.WaterGoal < minWaterGoal || backup.Settings.WaterGoal > maxWaterGoal {
		return invalidBackup(fmt.Sprintf("settings.waterGoal must be %d to %d", minWaterGoal, maxWaterGoal), nil)
	}

	owner := currentOwnerOf(c).ID
	ctx := c.Context()
	if err := s.inTx(c, func(q *database.Queries) error {
		// Replace, never merge (D34). Tasks go before the Categories they point to.
		for _, clear := range []func() error{
			func() error { return q.DeleteAllTasks(ctx, owner) },
			func() error { return q.DeleteAllCategories(ctx, owner) },
			func() error { return q.ClearRoutine(ctx, owner) },
			func() error { return q.DeleteAllChecklists(ctx, owner) },
			func() error { return q.DeleteSettings(ctx, owner) },
		} {
			if err := clear(); err != nil {
				return err
			}
		}

		// Categories get new IDs; Tasks follow them through the file's IDs.
		newIDs := map[int64]int64{}
		for oldID, name := range categoryNames {
			row, err := q.CreateCategory(ctx, database.CreateCategoryParams{OwnerID: owner, Name: name})
			if err != nil {
				return err
			}
			newIDs[oldID] = row.ID
		}
		for _, t := range tasks {
			var categoryID *int64
			if t.categoryRef != nil {
				id := newIDs[*t.categoryRef]
				categoryID = &id
			}
			if err := q.ImportTask(ctx, database.ImportTaskParams{
				OwnerID:     owner,
				Name:        t.fields.name,
				DueDate:     t.fields.dueDate,
				StartDate:   t.fields.startDate,
				StartTime:   t.fields.startTime,
				EndTime:     t.fields.endTime,
				Priority:    t.fields.priority,
				Progress:    int16(t.fields.progress),
				Note:        t.fields.note,
				CompletedAt: t.completedAt,
				CategoryID:  categoryID,
				CreatedAt:   t.createdAt,
				UpdatedAt:   t.updatedAt,
			}); err != nil {
				return err
			}
		}
		for _, entry := range routine {
			if err := q.AddRoutineEntry(ctx, database.AddRoutineEntryParams{OwnerID: owner, Hour: int16(entry.Hour), Text: entry.Text}); err != nil {
				return err
			}
		}
		for i, checklist := range checklists {
			if _, err := q.SaveDailyChecklist(ctx, checklist.saveParams(owner, dates[i])); err != nil {
				return err
			}
		}
		return q.SetWaterGoal(ctx, database.SetWaterGoalParams{OwnerID: owner, WaterGoal: int16(backup.Settings.WaterGoal)})
	}); err != nil {
		return err
	}

	return c.JSON(fiber.Map{"imported": fiber.Map{
		"categories": len(categoryNames),
		"tasks":      len(tasks),
		"routine":    len(routine),
		"checklists": len(checklists),
	}})
}
