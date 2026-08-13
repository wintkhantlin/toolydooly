package handler

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/sqs"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/wintkhantlin/toolydooly/todo-service/internal/aws/congito"
	"github.com/wintkhantlin/toolydooly/todo-service/internal/aws/queue"
	"github.com/wintkhantlin/toolydooly/todo-service/internal/db"
)

type DeleteTodoRequest struct {
	TodoID uuid.UUID `json:"id" validate:"required,min=1,max=16"`
}

func (h *Handler) DeleteTodo(w http.ResponseWriter, r *http.Request) {
	sub, ok := congito.UserSubjectFromContext(r.Context())

	if !ok {
		http.Error(w, "Unauthorized", 403)
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

	todo, err := h.Queries.GetTodoByID(r.Context(), todoID)
	if err != nil {
		http.Error(w, "todo not found", http.StatusNotFound)
		return
	}

	if todo.UserID.String() != sub.String() {
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
			MessageGroupId: aws.String(sub.String()),
		},
	)

	if err != nil {
		http.Error(w, "failed to send message", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusAccepted)
}
