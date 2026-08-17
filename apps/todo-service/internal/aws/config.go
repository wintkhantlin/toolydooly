package aws

import (
	"context"
	"log"

	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
	sharedsecrets "github.com/wintkhantlin/toolydooly/shared/aws/secrets"
)

type AppConfig struct {
	TodoQueueURL     string
	RealtimeQueueURL string
}

func NewAppConfig(s *secretsmanager.Client) *AppConfig {
	var queue sharedsecrets.Queue
	var realtime sharedsecrets.Queue

	if err := sharedsecrets.Get(*s, context.Background(), "todo/sqs/master", &queue); err != nil {
		log.Printf("load todo queue config: %v", err)
	}
	// Realtime queue secret is optional in case infra hasn't created it yet for local dev
	_ = sharedsecrets.Get(*s, context.Background(), "realtime/sqs/master", &realtime)

	return &AppConfig{
		TodoQueueURL:     queue.QueueURL,
		RealtimeQueueURL: realtime.QueueURL,
	}
}
