package middleware

import (
	"log"
	"net/http"

	"github.com/google/uuid"
	"github.com/wintkhantlin/toolydooly/shared/aws/congito"
)

func AuthMiddleware(
	verifier *congito.CognitoVerifier,
	next http.Handler,
) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token, err := congito.ExtractBearerToken(r)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		claims, err := verifier.Validate(token)
		if err != nil {
			log.Printf("validate cognito token: %v", err)

			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		if claims == nil {
			log.Printf("validate cognito token: nil claims")

			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		userID, err := uuid.Parse(claims.Subject)
		if err != nil {
			log.Printf("invalid cognito subject %q: %v", claims.Subject, err)

			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		ctx := congito.WithUserSubject(r.Context(), userID)

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
