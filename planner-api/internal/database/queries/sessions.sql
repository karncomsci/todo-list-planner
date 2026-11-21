-- name: CreateSession :exec
INSERT INTO sessions (token_hash, owner_id, expires_at)
VALUES ($1, $2, $3);

-- name: GetSessionOwner :one
SELECT o.id, o.email
FROM sessions s
JOIN owners o ON o.id = s.owner_id
WHERE s.token_hash = $1 AND s.expires_at > now();

-- name: DeleteSession :exec
DELETE FROM sessions WHERE token_hash = $1;

-- name: DeleteExpiredSessions :exec
DELETE FROM sessions WHERE expires_at <= now();
