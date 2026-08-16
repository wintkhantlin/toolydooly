package congito

import (
	"fmt"

	"github.com/MicahParks/keyfunc/v2"
	"go.uber.org/fx"
)

type CognitoVerifier struct {
	jwks     *keyfunc.JWKS
	issuer   string
	clientID string
}

func NewCognitoVerifier(userPoolID string, clientID string) (*CognitoVerifier, error) {
	jwksURL := fmt.Sprintf("http://ministack:4566/%s/.well-known/jwks.json", userPoolID)
	issuer := fmt.Sprintf("https://cognito-idp.us-east-1.amazonaws.com/%s", userPoolID)

	jwks, err := keyfunc.Get(jwksURL, keyfunc.Options{})
	if err != nil {
		return nil, fmt.Errorf("load cognito jwks: %w", err)
	}

	return &CognitoVerifier{
		jwks:     jwks,
		issuer:   issuer,
		clientID: clientID,
	}, nil
}

func NewCongitoVerifierInFx() *CognitoVerifier {
	verifier, err := NewCognitoVerifier(
		"us-east-1_LyN7rcqzo",
		"R3bLwnqqXXjKYzLlLwv9IOe2aD",
	)
	if err != nil {
		panic(err)
	}

	return verifier
}

func ProvideCognitoVerifier() fx.Option {
	return fx.Provide(NewCongitoVerifierInFx)
}
