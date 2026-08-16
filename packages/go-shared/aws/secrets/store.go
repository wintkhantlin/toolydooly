package secrets

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
)

func New(cfg *aws.Config) *secretsmanager.Client {
	return secretsmanager.NewFromConfig(*cfg)
}

func Get(
	s secretsmanager.Client,
	ctx context.Context,
	name string,
	out any,
) error {
	result, err := s.GetSecretValue(
		ctx,
		&secretsmanager.GetSecretValueInput{
			SecretId: aws.String(name),
		},
	)
	if err != nil {
		return fmt.Errorf("get secret %q: %w", name, err)
	}

	if result.SecretString == nil {
		return fmt.Errorf("secret %q has no string value", name)
	}

	if err := json.Unmarshal([]byte(*result.SecretString), out); err != nil {
		return fmt.Errorf("decode secret %q: %w", name, err)
	}

	return nil
}
