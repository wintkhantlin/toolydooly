package aws

import (
	"context"
	"os"

	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
	"github.com/wintkhantlin/toolydooly/todo-service/internal/aws/secrets"
)

func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}

	return defaultValue
}

type AppConfig struct {
	TodoQueueURL string
}

func NewAppConfig(s *secretsmanager.Client) *AppConfig {
	var queue secrets.Queue

	secrets.Get(*s, context.Background(), "todo/sqs/master", &queue)

	return &AppConfig{
		TodoQueueURL: queue.QueueURL,
	}
}
