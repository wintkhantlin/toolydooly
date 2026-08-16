package queue

import (
	"context"
	"fmt"

	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
	sharedsecrets "github.com/wintkhantlin/toolydooly/shared/aws/secrets"
)

type SecretName string

type Config struct {
	QueueURL string
}

func NewConfig(secretName SecretName, s *secretsmanager.Client) (*Config, error) {
	var queue sharedsecrets.Queue

	if err := sharedsecrets.Get(*s, context.Background(), string(secretName), &queue); err != nil {
		return nil, fmt.Errorf("load queue config: %w", err)
	}

	return &Config{
		QueueURL: queue.QueueURL,
	}, nil
}
