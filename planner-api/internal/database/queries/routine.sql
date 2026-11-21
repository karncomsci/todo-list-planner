-- name: ListRoutineEntries :many
-- The Owner's Routine; hours without a row are empty (D26).
SELECT hour, text FROM routine_entries
WHERE owner_id = sqlc.arg(owner_id)
ORDER BY hour;

-- name: ClearRoutine :exec
DELETE FROM routine_entries
WHERE owner_id = sqlc.arg(owner_id);

-- name: AddRoutineEntry :exec
INSERT INTO routine_entries (owner_id, hour, text)
VALUES (sqlc.arg(owner_id), sqlc.arg(hour), sqlc.arg(text));
