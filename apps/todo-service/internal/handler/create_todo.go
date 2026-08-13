package handler

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/sqs"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/wintkhantlin/toolydooly/todo-service/internal/aws/congito"
	"github.com/wintkhantlin/toolydooly/todo-service/internal/aws/queue"
	"github.com/wintkhantlin/toolydooly/todo-service/internal/db"
)

type CreateTodoRequest struct {
	Text     string `json:"text" validate:"required,min=1,max=500"`
	Priority int32  `json:"priority" validate:"gte=0,lte=10"`
}

func (h *Handler) CreateTodo(w http.ResponseWriter, r *http.Request) {
	sub, ok := congito.UserSubjectFromContext(r.Context())

	if !ok {
		http.Error(w, "Unauthorized", 403)
	}

	var req CreateTodoRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	req.Text = strings.TrimSpace(req.Text)

	if err := validate.Struct(req); err != nil {
		http.Error(w, "invalid todo", http.StatusBadRequest)
		return
	}

	todo := db.Todo{
		UserID: pgtype.UUID{
			Bytes: sub,
			Valid: true,
		},
		Text:     req.Text,
		Priority: req.Priority,
	}

	event := queue.TodoEvent{
		Action:    queue.TodoCreate,
		Timestamp: time.Now(),
		Payload:   todo,
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
