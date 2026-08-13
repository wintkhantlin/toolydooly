package handler

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/wintkhantlin/toolydooly/todo-service/internal/aws/congito"
)

func (h *Handler) GetTodo(w http.ResponseWriter, r *http.Request) {
	sub, ok := congito.UserSubjectFromContext(r.Context())

	if !ok {
		http.Error(w, "Unauthorized", 403)
	}

	todos, err := h.Queries.ListTodosByUserID(context.Background(), pgtype.UUID{
		Bytes: uuid.MustParse(sub),
		Valid: true,
	})

	if err != nil {
		http.Error(w, "Something went wrong", 500)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	json.NewEncoder(w).Encode(todos)
}
