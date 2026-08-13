package middleware

import (
	"net/http"

	"github.com/wintkhantlin/toolydooly/todo-service/internal/aws/congito"
	"github.com/wintkhantlin/toolydooly/todo-service/internal/handler"
)

func AuthMiddleware(
	verifier *congito.CognitoVerifier,
	next http.Handler,
) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token, err := handler.ExtractBearerToken(r)

		if err != nil {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		claims, err := verifier.Validate(token)

		ctx := congito.WithUserSubject(r.Context(), claims.Subject)

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
