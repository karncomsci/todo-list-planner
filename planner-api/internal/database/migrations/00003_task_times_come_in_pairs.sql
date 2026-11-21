-- +goose Up
-- A Task with a time has both a start time and an end time (A1).
ALTER TABLE tasks DROP CONSTRAINT tasks_check1; -- the name PostgreSQL gave it in 00002
ALTER TABLE tasks ADD CONSTRAINT tasks_times_pair_check CHECK ((start_time IS NULL) = (end_time IS NULL));

-- +goose Down
ALTER TABLE tasks DROP CONSTRAINT tasks_times_pair_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_check1 CHECK (end_time IS NULL OR start_time IS NOT NULL);
