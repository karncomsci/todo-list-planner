-- Backup export and import (D33, D34). Import runs these in one transaction.

-- name: ListAllTasks :many
SELECT * FROM tasks
WHERE owner_id = sqlc.arg(owner_id)
ORDER BY id;

-- name: ListAllChecklists :many
SELECT * FROM daily_checklists
WHERE owner_id = sqlc.arg(owner_id)
ORDER BY day;

-- name: DeleteAllTasks :exec
DELETE FROM tasks WHERE owner_id = sqlc.arg(owner_id);

-- name: DeleteAllCategories :exec
DELETE FROM categories WHERE owner_id = sqlc.arg(owner_id);

-- name: DeleteAllChecklists :exec
DELETE FROM daily_checklists WHERE owner_id = sqlc.arg(owner_id);

-- name: DeleteSettings :exec
DELETE FROM owner_settings WHERE owner_id = sqlc.arg(owner_id);

-- name: ImportTask :exec
-- A Task from a backup, keeping its completed-at, created-at and updated-at times.
INSERT INTO tasks (owner_id, name, due_date, start_date, start_time, end_time, priority, progress,
    note, completed_at, category_id, created_at, updated_at)
VALUES (
    sqlc.arg(owner_id), sqlc.arg(name), sqlc.arg(due_date), sqlc.narg(start_date),
    sqlc.arg(start_time), sqlc.arg(end_time), sqlc.arg(priority), sqlc.arg(progress),
    sqlc.arg(note), sqlc.narg(completed_at), sqlc.narg(category_id), sqlc.arg(created_at), sqlc.arg(updated_at)
);
