package queue

import (
	"encoding/json"
	"time"
)

type ActionState string

const (
	TodoCreate ActionState = "TODO_CREATE"
	TodoDelete ActionState = "TODO_DELETE"
	TodoUpdate ActionState = "TODO_UPDATE"
)

// TodoPayload is a lightweight, portable representation of a Todo used in events.
// IDs and UserIDs are strings (UUIDs) for cross-service compatibility.
type TodoPayload struct {
	ID       string `json:"id,omitempty"`
	Text     string `json:"text,omitempty"`
	UserID   string `json:"user_id,omitempty"`
	Priority int32  `json:"priority,omitempty"`
}

type TodoEvent struct {
	Action    ActionState `json:"action"`
	Timestamp time.Time   `json:"timestamp"`
	Payload   TodoPayload `json:"payload"`
}

func ParseTodoEvent(body []byte) (TodoEvent, error) {
	var event TodoEvent
	if err := json.Unmarshal(body, &event); err != nil {
		return TodoEvent{}, err
	}
	return event, nil
}

func ExtractUserID(body []byte) (string, bool) {
	event, err := ParseTodoEvent(body)
	if err != nil || event.Payload.UserID == "" {
		return "", false
	}
	return event.Payload.UserID, true
}
