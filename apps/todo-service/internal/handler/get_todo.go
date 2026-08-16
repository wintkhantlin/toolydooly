package handler

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/jackc/pgx/v5/pgtype"

	"github.com/wintkhantlin/toolydooly/shared/aws/congito"
	"github.com/wintkhantlin/toolydooly/todo-service/internal/db"
)

func (h *Handler) GetTodo(w http.ResponseWriter, r *http.Request) {
	userID, ok := congito.UserSubjectFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	todos, err := h.Queries.ListTodosByUserID(
		r.Context(),
		pgtype.UUID{
			Bytes: userID,
			Valid: true,
		},
	)
	if err != nil {
		log.Printf("list todos for user %s: %v", userID, err)

		http.Error(
			w,
			"Internal server error",
			http.StatusInternalServerError,
		)
		return
	}

	if todos == nil {
		todos = make([]db.Todo, 0)
	}

	w.Header().Set("Content-Type", "application/json")

	if err := json.NewEncoder(w).Encode(todos); err != nil {
		log.Printf("encode todos for user %s: %v", userID, err)
	}
}
