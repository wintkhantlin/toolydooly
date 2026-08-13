package handler

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/service/sqs"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/wintkhantlin/toolydooly/todo-service/internal/aws/queue"
	"github.com/wintkhantlin/toolydooly/todo-service/internal/db"
)

type DeleteTodoRequest struct {
	TodoID uuid.UUID `json:"id" validate:"required,min=1,max=16"`
}

func (h *Handler) DeleteTodo(w http.ResponseWriter, r *http.Request) {
	userID := strings.TrimSpace(r.Header.Get("X-User-Subject"))

	if userID == "" {
		http.Error(w, "missing user subject", http.StatusUnauthorized)
		return
	}

	var req DeleteTodoRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	todoID := pgtype.UUID{
		Bytes: req.TodoID,
		Valid: true,
	}

	// Check existence + ownership.
	todo, err := h.Queries.GetTodoByID(r.Context(), todoID)
	if err != nil {
		http.Error(w, "todo not found", http.StatusNotFound)
		return
	}

	if todo.UserID.String() != userID {
		http.Error(w, "todo not found", http.StatusNotFound)
		return
	}

	event := queue.TodoEvent{
		Action:    queue.TodoDelete,
		Timestamp: time.Now(),
		Payload: db.Todo{
			ID:     todoID,
			UserID: todo.UserID,
		},
	}

	payload, err := json.Marshal(event)
	if err != nil {
		http.Error(w, "failed to encode event", http.StatusInternalServerError)
		return
	}

	message := string(payload)

	_, err = h.Queue.SendMessage(
		r.Context(),
		&sqs.SendMessageInput{
			QueueUrl:       &h.AppCfg.TodoQueueURL,
			MessageBody:    &message,
			MessageGroupId: &userID,
		},
	)

	if err != nil {
		http.Error(w, "failed to send message", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusAccepted)
}
