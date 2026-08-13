-- name: CreateTodo :one
INSERT INTO todo (
    text,
    user_id,
    priority
)
VALUES (
    $1,
    $2,
    $3
)
RETURNING *;


-- name: GetTodoByID :one
SELECT *
FROM todo
WHERE id = $1
  AND is_deleted = FALSE;


-- name: ListTodosByUserID :many
SELECT *
FROM todo
WHERE user_id = $1
  AND is_deleted = FALSE
ORDER BY created_at DESC;


-- name: UpdateTodo :one
-- name: UpdateTodo :one
UPDATE todo
SET
    text = $2,
    priority = $3,
    updated_at = NOW()
WHERE id = $1
  AND user_id = $4
  AND is_deleted = FALSE
RETURNING *;


-- name: CompleteTodo :one
UPDATE todo
SET
    is_done = TRUE,
    done_at = NOW(),
    updated_at = NOW()
WHERE id = $1
  AND is_deleted = FALSE
RETURNING *;


-- name: UncompleteTodo :one
UPDATE todo
SET
    is_done = FALSE,
    done_at = NULL,
    updated_at = NOW()
WHERE id = $1
  AND is_deleted = FALSE
RETURNING *;


-- name: SoftDeleteTodo :exec
UPDATE todo
SET
    is_deleted = TRUE,
    updated_at = NOW()
WHERE id = $1;


-- name: RestoreTodo :one
UPDATE todo
SET
    is_deleted = FALSE,
    updated_at = NOW()
WHERE id = $1
RETURNING *;


-- name: CountTodosByUserID :one
SELECT COUNT(*)
FROM todo
WHERE user_id = $1
  AND is_deleted = FALSE;


-- name: ListCompletedTodosByUserID :many
SELECT *
FROM todo
WHERE user_id = $1
  AND is_done = TRUE
  AND is_deleted = FALSE
ORDER BY done_at DESC;


-- name: ListPendingTodosByUserID :many
SELECT *
FROM todo
WHERE user_id = $1
  AND is_done = FALSE
  AND is_deleted = FALSE
ORDER BY priority ASC, created_at DESC;
