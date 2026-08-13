package queue

import (
	"time"

	"github.com/wintkhantlin/toolydooly/todo-service/internal/db"
)

type ActionState string

const (
	TodoCreate ActionState = "TODO_CREATE"
	TodoDelete ActionState = "TODO_DELETE"
	TodoUpdate ActionState = "TODO_UPDATE"
)

type TodoEvent struct {
	Action    ActionState `json:"action"`
	Timestamp time.Time   `json:"timestamp"`
	Payload   db.Todo     `json:"payload"`
}
