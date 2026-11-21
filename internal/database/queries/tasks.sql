-- name: CreateTask :one
INSERT INTO tasks (owner_id, name, due_date, start_date, start_time, end_time, priority, progress, note, completed_at)
VALUES (
    sqlc.arg(owner_id), sqlc.arg(name), sqlc.arg(due_date), sqlc.narg(start_date),
    sqlc.arg(start_time), sqlc.arg(end_time), sqlc.arg(priority), sqlc.arg(progress),
    sqlc.arg(note), sqlc.narg(completed_at)
)
RETURNING *;

-- name: ListRecentTasks :many
-- The Owner's most recently changed Tasks, for the list beside the Task form (story 17).
SELECT * FROM tasks
WHERE owner_id = sqlc.arg(owner_id)
ORDER BY updated_at DESC, id DESC
LIMIT sqlc.arg(max_rows);
