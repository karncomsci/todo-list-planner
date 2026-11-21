-- name: GetDailyChecklist :one
SELECT * FROM daily_checklists
WHERE owner_id = sqlc.arg(owner_id) AND day = sqlc.arg(day);

-- name: SaveDailyChecklist :one
-- Creates or replaces the Owner's checklist for one day (D27).
INSERT INTO daily_checklists (owner_id, day, glasses, breakfast_menu, breakfast_done,
    lunch_menu, lunch_done, dinner_menu, dinner_done, note)
VALUES (sqlc.arg(owner_id), sqlc.arg(day), sqlc.arg(glasses), sqlc.arg(breakfast_menu), sqlc.arg(breakfast_done),
    sqlc.arg(lunch_menu), sqlc.arg(lunch_done), sqlc.arg(dinner_menu), sqlc.arg(dinner_done), sqlc.arg(note))
ON CONFLICT (owner_id, day) DO UPDATE SET
    glasses        = EXCLUDED.glasses,
    breakfast_menu = EXCLUDED.breakfast_menu,
    breakfast_done = EXCLUDED.breakfast_done,
    lunch_menu     = EXCLUDED.lunch_menu,
    lunch_done     = EXCLUDED.lunch_done,
    dinner_menu    = EXCLUDED.dinner_menu,
    dinner_done    = EXCLUDED.dinner_done,
    note           = EXCLUDED.note,
    updated_at     = now()
RETURNING *;

-- name: GetWaterGoal :one
-- The Owner's Water Goal, 8 when never saved (D28, A4).
SELECT coalesce((SELECT water_goal FROM owner_settings WHERE owner_id = sqlc.arg(owner_id)), 8)::smallint AS water_goal;
