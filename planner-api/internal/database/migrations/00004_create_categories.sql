-- +goose Up
-- A Category groups Tasks; names are unique per Owner, ignoring letter case (D24).
CREATE TABLE categories (
    id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    owner_id   bigint      NOT NULL REFERENCES owners (id) ON DELETE CASCADE,
    name       text        NOT NULL CHECK (btrim(name) <> '' AND char_length(name) <= 50),
    created_at timestamptz NOT NULL DEFAULT now(),
    -- Target of the Task foreign key below, so a Task can only use its own Owner's Category (D19).
    UNIQUE (id, owner_id)
);

CREATE UNIQUE INDEX categories_owner_name_key ON categories (owner_id, lower(name));

-- A Task has one Category or none. Deleting a Category leaves its Tasks
-- uncategorised (D24): only category_id is cleared, never owner_id.
ALTER TABLE tasks ADD COLUMN category_id bigint;
ALTER TABLE tasks ADD CONSTRAINT tasks_category_fkey
    FOREIGN KEY (category_id, owner_id) REFERENCES categories (id, owner_id) ON DELETE SET NULL (category_id);
CREATE INDEX tasks_category_idx ON tasks (category_id);

-- +goose Down
ALTER TABLE tasks DROP COLUMN category_id;
DROP TABLE categories;
