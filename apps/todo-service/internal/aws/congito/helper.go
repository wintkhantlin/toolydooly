package congito

import (
	"context"

	"github.com/google/uuid"
)

type contextKey struct{}

var userIDKey contextKey

func WithUserSubject(ctx context.Context, userID uuid.UUID) context.Context {
	return context.WithValue(ctx, userIDKey, userID)
}

func UserSubjectFromContext(ctx context.Context) (uuid.UUID, bool) {
	userID, ok := ctx.Value(userIDKey).(uuid.UUID)
	return userID, ok
}
