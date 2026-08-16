package internal

import (
	"context"
	"log"
	"sync"

	"github.com/aws/aws-sdk-go-v2/service/sqs"
	sharedqueue "github.com/wintkhantlin/toolydooly/shared/aws/queue"
	"go.uber.org/fx"
)

// StartQueueConsumer consumes messages from SQS and broadcasts them to the Hub.
func StartQueueConsumer(
	lc fx.Lifecycle,
	client *sqs.Client,
	cfg *sharedqueue.Config,
	h *Hub,
) {
	var (
		cancel context.CancelFunc
		wg     sync.WaitGroup
	)

	lc.Append(fx.Hook{
		OnStart: func(ctx context.Context) error {
			consumerCtx, cancelFunc := context.WithCancel(context.Background())
			cancel = cancelFunc

			wg.Add(1)

			go func() {
				defer wg.Done()

				for {
					if consumerCtx.Err() != nil {
						return
					}

					messages, err := client.ReceiveMessage(
						consumerCtx,
						&sqs.ReceiveMessageInput{
							QueueUrl:            &cfg.QueueURL,
							MaxNumberOfMessages: 10,
							VisibilityTimeout:   30,
							WaitTimeSeconds:     20,
						},
					)
					if err != nil {
						if consumerCtx.Err() != nil {
							return
						}

						log.Println("receive message error:", err)
						continue
					}

					for _, message := range messages.Messages {
						if message.Body == nil {
							continue
						}

						payload := []byte(*message.Body)
						if uid, ok := sharedqueue.ExtractUserID(payload); ok {
							h.SendToUser(uid, payload)
						} else {
							h.Broadcast(payload)
						}

						_, err := client.DeleteMessage(
							context.Background(),
							&sqs.DeleteMessageInput{
								QueueUrl:      &cfg.QueueURL,
								ReceiptHandle: message.ReceiptHandle,
							},
						)
						if err != nil {
							log.Println("delete sqs message error:", err)
						}
					}
				}
			}()

			return nil
		},

		OnStop: func(ctx context.Context) error {
			if cancel != nil {
				cancel()
			}

			wg.Wait()
			return nil
		},
	})
}
