package handler

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/sqs"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/wintkhantlin/toolydooly/shared/aws/congito"
	"github.com/wintkhantlin/toolydooly/shared/aws/queue"
)

func (h *Handler) DeleteTodo(w http.ResponseWriter, r *http.Request) {
	sub, ok := congito.UserSubjectFromContext(r.Context())

	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	todoIDStr := chi.URLParam(r, "id")
	if todoIDStr == "" {
		http.Error(w, "missing todo id", http.StatusBadRequest)
		return
	}

	todoUUID, err := uuid.Parse(todoIDStr)
	if err != nil {
		http.Error(w, "invalid todo id", http.StatusBadRequest)
		return
	}

	todoID := pgtype.UUID{
		Bytes: todoUUID,
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
		Payload: queue.TodoPayload{
			ID:     todoID.String(),
			UserID: todo.UserID.String(),
		},
	}

	payload, err := json.Marshal(event)
	if err != nil {
		http.Error(w, "failed to encode event", http.StatusInternalServerError)
		return
	}

	message := string(payload)

	// send to todo processing queue
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

	// publish to realtime queue only if configured
	if h.AppCfg.RealtimeQueueURL != "" {
		_, err = h.Queue.SendMessage(
			r.Context(),
			&sqs.SendMessageInput{
				QueueUrl:       &h.AppCfg.RealtimeQueueURL,
				MessageBody:    &message,
				MessageGroupId: aws.String(sub.String()),
			},
		)

		if err != nil {
			// don't fail the request if realtime publish fails; just swallow
		}
	}

	w.WriteHeader(http.StatusAccepted)
}
