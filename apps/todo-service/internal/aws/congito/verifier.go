package congito

import (
	"fmt"
	"net/http"

	"github.com/MicahParks/keyfunc/v2"
)

type CognitoVerifier struct {
	jwks     *keyfunc.JWKS
	issuer   string
	clientID string
}

func NewCognitoVerifier(
	userPoolID string,
	clientID string,
) (*CognitoVerifier, error) {
	issuer := fmt.Sprintf(
		"http://ministack:4566/%s",
		userPoolID,
	)

	jwksURL := issuer + "/.well-known/jwks.json"

	resp, err := http.Get(jwksURL)
	if err != nil {
		return nil, fmt.Errorf("test jwks request: %w", err)
	}
	defer resp.Body.Close()

	fmt.Println("JWKS URL:", jwksURL)
	fmt.Println("JWKS STATUS:", resp.Status)

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
		"us-east-1_hmhgwaPgZ",
		"99WU3GD9tDeqSBzywMxfCAwsbA",
	)

	if err != nil {
		panic(err)
	}

	return verifier
}
