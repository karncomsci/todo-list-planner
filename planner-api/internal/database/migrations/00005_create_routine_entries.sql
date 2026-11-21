-- +goose Up
-- The Routine: one template per Owner, one text entry per hour from 05:00 to
-- 23:00, no ticking and no history (D26). An empty hour has no row.
CREATE TABLE routine_entries (
    owner_id bigint   NOT NULL REFERENCES owners (id) ON DELETE CASCADE,
    hour     smallint NOT NULL CHECK (hour BETWEEN 5 AND 23),
    text     text     NOT NULL CHECK (btrim(text) <> '' AND char_length(text) <= 200),
    PRIMARY KEY (owner_id, hour)
);

-- +goose Down
DROP TABLE routine_entries;
