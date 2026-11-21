-- name: CountOwners :one
SELECT count(*) FROM owners;

-- name: CreateOwner :one
INSERT INTO owners (email, password_hash)
VALUES ($1, $2)
RETURNING id, email;

-- name: GetOwnerByEmail :one
SELECT id, email, password_hash FROM owners
WHERE email = $1;

-- name: GetOwnerPasswordHash :one
SELECT password_hash FROM owners
WHERE id = $1;

-- name: SetOwnerPassword :exec
UPDATE owners SET password_hash = sqlc.arg(password_hash)
WHERE id = sqlc.arg(id);
