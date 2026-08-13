package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

func (h *Handler) GetTodo(w http.ResponseWriter, r *http.Request) {
	userID := strings.TrimSpace(r.Header.Get("X-User-Subject"))

	if userID == "" {
		http.Error(w, "missing user subject", http.StatusUnauthorized)
		return
	}

	todos, err := h.Queries.ListTodosByUserID(context.Background(), pgtype.UUID{
		Bytes: uuid.MustParse(userID),
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
