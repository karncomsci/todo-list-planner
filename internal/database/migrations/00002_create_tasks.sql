-- +goose Up
-- A Task (D20). Status and Overdue are derived on read and never stored (D21, D23).
-- The Category column arrives with Categories (ticket 06).
CREATE TABLE tasks (
    id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    owner_id     bigint      NOT NULL REFERENCES owners (id) ON DELETE CASCADE,
    name         text        NOT NULL CHECK (btrim(name) <> '' AND char_length(name) <= 200),
    due_date     date        NOT NULL,
    start_date   date        CHECK (start_date <= due_date),
    start_time   time,
    end_time     time        CHECK (end_time IS NULL OR start_time IS NOT NULL),
    priority     text        NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    progress     smallint    NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    note         text        NOT NULL DEFAULT '',
    -- Set when Progress reaches 100, cleared below 100 (D22).
    completed_at timestamptz CHECK ((progress = 100) = (completed_at IS NOT NULL)),
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX tasks_owner_due_idx ON tasks (owner_id, due_date);
CREATE INDEX tasks_owner_updated_idx ON tasks (owner_id, updated_at DESC);

-- +goose Down
DROP TABLE tasks;
