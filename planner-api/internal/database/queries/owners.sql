-- name: CountOwners :one
SELECT count(*) FROM owners;

-- name: CreateOwner :one
INSERT INTO owners (email, password_hash)
VALUES ($1, $2)
RETURNING id, email;

-- name: GetOwnerByEmail :one
SELECT id, email, password_hash FROM owners
WHERE email = $1;
