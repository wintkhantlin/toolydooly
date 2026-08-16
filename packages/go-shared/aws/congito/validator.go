package congito

import (
	"fmt"

	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	TokenUse string `json:"token_use"`
	ClientID string `json:"client_id,omitempty"`

	jwt.RegisteredClaims
}

func (v *CognitoVerifier) Validate(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(
		tokenString,
		&Claims{},
		v.jwks.Keyfunc,
		jwt.WithIssuer(v.issuer),
	)
	if err != nil {
		return nil, fmt.Errorf("validate cognito token: %w", err)
	}

	if !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}

	claims, ok := token.Claims.(*Claims)
	if !ok {
		return nil, fmt.Errorf("invalid claims")
	}

	if claims.TokenUse != "access" {
		return nil, fmt.Errorf("token is not an access token")
	}

	if claims.ClientID != v.clientID {
		return nil, fmt.Errorf("invalid client id")
	}

	if claims.Subject == "" {
		return nil, fmt.Errorf("missing sub")
	}

	return claims, nil
}
