-- name: ListTasksDueInRange :many
-- The Owner's Tasks due in a range, both ends inclusive: the set most Reports
-- metrics count (A6, D31).
SELECT tasks.due_date, tasks.progress, tasks.priority, tasks.completed_at,
       tasks.category_id, categories.name AS category_name
FROM tasks
LEFT JOIN categories ON categories.id = tasks.category_id
WHERE tasks.owner_id = sqlc.arg(owner_id)
  AND tasks.due_date BETWEEN sqlc.arg(from_date)::date AND sqlc.arg(to_date)::date;

-- name: ListCompletionDays :many
-- How many of the Owner's Tasks were completed on each day of a range, the
-- day taken in Thailand (D9, D22, story 49).
SELECT (completed_at AT TIME ZONE 'Asia/Bangkok')::date AS day, count(*) AS completed
FROM tasks
WHERE owner_id = sqlc.arg(owner_id)
  AND completed_at IS NOT NULL
  AND (completed_at AT TIME ZONE 'Asia/Bangkok')::date BETWEEN sqlc.arg(from_date)::date AND sqlc.arg(to_date)::date
GROUP BY 1
ORDER BY 1;

-- name: ListChecklistsInRange :many
-- The Owner's Daily Checklists in a range (story 53); days without a row are empty.
SELECT day, glasses, breakfast_done, lunch_done, dinner_done
FROM daily_checklists
WHERE owner_id = sqlc.arg(owner_id)
  AND day BETWEEN sqlc.arg(from_date)::date AND sqlc.arg(to_date)::date
ORDER BY day;
