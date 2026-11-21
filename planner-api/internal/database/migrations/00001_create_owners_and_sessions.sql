-- +goose Up
CREATE TABLE owners (
    id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    -- Stored lower-cased; sign-in compares lower-cased input.
    email         text        NOT NULL UNIQUE CHECK (email = lower(email)),
    -- One-way hash only (D18).
    password_hash text        NOT NULL,
    created_at    timestamptz NOT NULL DEFAULT now()
);

-- Sessions live in PostgreSQL (D17). The cookie carries a random token;
-- only its SHA-256 is stored, so a database copy cannot be replayed as a cookie.
CREATE TABLE sessions (
    token_hash bytea       PRIMARY KEY,
    owner_id   bigint      NOT NULL REFERENCES owners (id) ON DELETE CASCADE,
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX sessions_owner_id_idx ON sessions (owner_id);
CREATE INDEX sessions_expires_at_idx ON sessions (expires_at);

-- +goose Down
DROP TABLE sessions;
DROP TABLE owners;
