package congito

import (
	sharedcongito "github.com/wintkhantlin/toolydooly/shared/aws/congito"
)

type CognitoVerifier = sharedcongito.CognitoVerifier

type Claims = sharedcongito.Claims

func NewCognitoVerifier(userPoolID string, clientID string) (*CognitoVerifier, error) {
	return sharedcongito.NewCognitoVerifier(userPoolID, clientID)
}

func NewCongitoVerifierInFx() *CognitoVerifier {
	return sharedcongito.NewCongitoVerifierInFx()
}
