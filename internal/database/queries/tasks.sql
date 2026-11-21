-- name: CreateTask :one
INSERT INTO tasks (owner_id, name, due_date, start_date, start_time, end_time, priority, progress, note, completed_at, category_id)
VALUES (
    sqlc.arg(owner_id), sqlc.arg(name), sqlc.arg(due_date), sqlc.narg(start_date),
    sqlc.arg(start_time), sqlc.arg(end_time), sqlc.arg(priority), sqlc.arg(progress),
    sqlc.arg(note), sqlc.narg(completed_at), sqlc.narg(category_id)
)
RETURNING *;

-- name: ListRecentTasks :many
-- The Owner's most recently changed Tasks, for the list beside the Task form (story 17).
SELECT sqlc.embed(tasks), categories.name AS category_name
FROM tasks
LEFT JOIN categories ON categories.id = tasks.category_id
WHERE tasks.owner_id = sqlc.arg(owner_id)
ORDER BY tasks.updated_at DESC, tasks.id DESC
LIMIT sqlc.arg(max_rows);

-- name: GetTask :one
-- Only the Owner's own Task: another Owner's is as if it did not exist (D19).
SELECT sqlc.embed(tasks), categories.name AS category_name
FROM tasks
LEFT JOIN categories ON categories.id = tasks.category_id
WHERE tasks.id = sqlc.arg(id) AND tasks.owner_id = sqlc.arg(owner_id);

-- name: UpdateTask :one
-- Replaces every field. completed_at keeps its first value while Progress stays
-- at 100, takes the save time when Progress reaches 100, and clears below (D22).
UPDATE tasks SET
    name         = sqlc.arg(name),
    due_date     = sqlc.arg(due_date),
    start_date   = sqlc.narg(start_date),
    start_time   = sqlc.arg(start_time),
    end_time     = sqlc.arg(end_time),
    priority     = sqlc.arg(priority),
    progress     = sqlc.arg(progress),
    note         = sqlc.arg(note),
    category_id  = sqlc.narg(category_id),
    completed_at = CASE WHEN sqlc.arg(progress)::smallint = 100
                        THEN coalesce(completed_at, sqlc.arg(now)::timestamptz) END,
    updated_at   = now()
WHERE id = sqlc.arg(id) AND owner_id = sqlc.arg(owner_id)
RETURNING *;

-- name: DeleteTask :execrows
DELETE FROM tasks
WHERE id = sqlc.arg(id) AND owner_id = sqlc.arg(owner_id);

-- name: ListTasksInRange :many
-- Every Task whose span touches the range: from its start date (or due date
-- when it has none) to its due date, both ends inclusive (D14, stories 24, 25).
SELECT sqlc.embed(tasks), categories.name AS category_name
FROM tasks
LEFT JOIN categories ON categories.id = tasks.category_id
WHERE tasks.owner_id = sqlc.arg(owner_id)
  AND tasks.due_date >= sqlc.arg(from_date)::date
  AND coalesce(tasks.start_date, tasks.due_date) <= sqlc.arg(to_date)::date
ORDER BY coalesce(tasks.start_date, tasks.due_date), tasks.start_time NULLS FIRST, tasks.id;
