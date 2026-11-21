-- name: ListCategories :many
SELECT * FROM categories
WHERE owner_id = sqlc.arg(owner_id)
ORDER BY lower(name), id;

-- name: CreateCategory :one
INSERT INTO categories (owner_id, name)
VALUES (sqlc.arg(owner_id), sqlc.arg(name))
RETURNING *;

-- name: GetCategory :one
-- Only the Owner's own Category: another Owner's is as if it did not exist (D19).
SELECT * FROM categories
WHERE id = sqlc.arg(id) AND owner_id = sqlc.arg(owner_id);

-- name: RenameCategory :one
UPDATE categories SET name = sqlc.arg(name)
WHERE id = sqlc.arg(id) AND owner_id = sqlc.arg(owner_id)
RETURNING *;

-- name: DeleteCategory :execrows
-- Its Tasks stay, uncategorised, through the foreign key (D24).
DELETE FROM categories
WHERE id = sqlc.arg(id) AND owner_id = sqlc.arg(owner_id);
