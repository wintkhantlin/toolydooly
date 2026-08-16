package congito

import (
	"context"

	"github.com/google/uuid"
	sharedcongito "github.com/wintkhantlin/toolydooly/shared/aws/congito"
)

func WithUserSubject(ctx context.Context, userID uuid.UUID) context.Context {
	return sharedcongito.WithUserSubject(ctx, userID)
}

func UserSubjectFromContext(ctx context.Context) (uuid.UUID, bool) {
	return sharedcongito.UserSubjectFromContext(ctx)
}
