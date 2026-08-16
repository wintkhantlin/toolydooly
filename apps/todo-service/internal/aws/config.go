package aws

import (
	"context"
	"os"

	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
	"github.com/wintkhantlin/toolydooly/shared/aws/secrets"
)

func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}

	return defaultValue
}

type AppConfig struct {
	TodoQueueURL     string
	RealtimeQueueURL string
}

func NewAppConfig(s *secretsmanager.Client) *AppConfig {
	var queue secrets.Queue
	var realtime secrets.Queue

	secrets.Get(*s, context.Background(), "todo/sqs/master", &queue)
	// Realtime queue secret is optional in case infra hasn't created it yet for local dev
	_ = secrets.Get(*s, context.Background(), "realtime/sqs/master", &realtime)

	return &AppConfig{
		TodoQueueURL:     queue.QueueURL,
		RealtimeQueueURL: realtime.QueueURL,
	}
}
