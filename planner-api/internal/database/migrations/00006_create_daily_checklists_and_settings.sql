-- +goose Up
-- The Daily Checklist: one per Owner per day (D27). A day without a row is an
-- empty checklist; past days are kept for Reports (story 47).
CREATE TABLE daily_checklists (
    owner_id       bigint      NOT NULL REFERENCES owners (id) ON DELETE CASCADE,
    day            date        NOT NULL,
    glasses        smallint    NOT NULL DEFAULT 0 CHECK (glasses BETWEEN 0 AND 30),
    breakfast_menu text        NOT NULL DEFAULT '' CHECK (char_length(breakfast_menu) <= 100),
    breakfast_done boolean     NOT NULL DEFAULT false,
    lunch_menu     text        NOT NULL DEFAULT '' CHECK (char_length(lunch_menu) <= 100),
    lunch_done     boolean     NOT NULL DEFAULT false,
    dinner_menu    text        NOT NULL DEFAULT '' CHECK (char_length(dinner_menu) <= 100),
    dinner_done    boolean     NOT NULL DEFAULT false,
    note           text        NOT NULL DEFAULT '' CHECK (char_length(note) <= 1000),
    updated_at     timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (owner_id, day)
);

-- Settings (D28). An Owner without a row has the defaults: Water Goal 8 (A4).
CREATE TABLE owner_settings (
    owner_id   bigint   PRIMARY KEY REFERENCES owners (id) ON DELETE CASCADE,
    water_goal smallint NOT NULL DEFAULT 8 CHECK (water_goal BETWEEN 1 AND 30)
);

-- +goose Down
DROP TABLE owner_settings;
DROP TABLE daily_checklists;
