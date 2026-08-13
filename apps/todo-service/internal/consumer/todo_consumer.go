package consumer

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"sync"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/sqs"
	"github.com/aws/aws-sdk-go-v2/service/sqs/types"
	"go.uber.org/fx"

	c "github.com/wintkhantlin/toolydooly/todo-service/internal/aws"
	"github.com/wintkhantlin/toolydooly/todo-service/internal/aws/queue"
	"github.com/wintkhantlin/toolydooly/todo-service/internal/db"
)

func StartTodoConsumer(
	lc fx.Lifecycle,
	client *sqs.Client,
	cfg *c.AppConfig,
	queries *db.Queries,
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
							QueueUrl:            &cfg.TodoQueueURL,
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
						if err := processMessage(
							consumerCtx,
							client,
							cfg.TodoQueueURL,
							queries,
							message,
						); err != nil {
							log.Println("process message error:", err)
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

func processMessage(
	ctx context.Context,
	client *sqs.Client,
	queueURL string,
	queries *db.Queries,
	message types.Message,
) error {
	// Always delete the message when this function finishes,
	// regardless of whether processing succeeds or fails.
	defer func() {
		_, err := client.DeleteMessage(
			context.Background(),
			&sqs.DeleteMessageInput{
				QueueUrl:      &queueURL,
				ReceiptHandle: message.ReceiptHandle,
			},
		)

		if err != nil {
			log.Println("delete sqs message error:", err)
		}
	}()

	var event queue.TodoEvent

	if err := json.Unmarshal(
		[]byte(aws.ToString(message.Body)),
		&event,
	); err != nil {
		return fmt.Errorf("decode todo event: %w", err)
	}

	switch event.Action {
	case queue.TodoCreate:
		if err := handleCreate(ctx, queries, event); err != nil {
			return err
		}

	case queue.TodoUpdate:
		if err := handleUpdate(ctx, queries, event); err != nil {
			return err
		}

	case queue.TodoDelete:
		if err := handleDelete(ctx, queries, event); err != nil {
			return err
		}

	default:
		return fmt.Errorf("unknown todo action: %v", event.Action)
	}

	return nil
}

func handleCreate(
	ctx context.Context,
	queries *db.Queries,
	event queue.TodoEvent,
) error {
	_, err := queries.CreateTodo(
		ctx,
		db.CreateTodoParams{
			Text:     event.Payload.Text,
			UserID:   event.Payload.UserID,
			Priority: event.Payload.Priority,
		},
	)

	if err != nil {
		return fmt.Errorf("create todo: %w", err)
	}

	return nil
}

func handleUpdate(
	ctx context.Context,
	queries *db.Queries,
	event queue.TodoEvent,
) error {
	todo, err := queries.GetTodoByID(
		ctx,
		event.Payload.ID,
	)
	if err != nil {
		return fmt.Errorf("get todo for update: %w", err)
	}

	if todo.UserID != event.Payload.UserID {
		return fmt.Errorf("todo does not belong to user")
	}

	_, err = queries.UpdateTodo(
		ctx,
		db.UpdateTodoParams{
			ID:       event.Payload.ID,
			Text:     event.Payload.Text,
			Priority: event.Payload.Priority,
		},
	)

	if err != nil {
		return fmt.Errorf("update todo: %w", err)
	}

	return nil
}

func handleDelete(
	ctx context.Context,
	queries *db.Queries,
	event queue.TodoEvent,
) error {
	todo, err := queries.GetTodoByID(
		ctx,
		event.Payload.ID,
	)
	if err != nil {
		return fmt.Errorf("get todo for delete: %w", err)
	}

	if todo.UserID != event.Payload.UserID {
		return fmt.Errorf("todo does not belong to user")
	}

	err = queries.SoftDeleteTodo(
		ctx,
		event.Payload.ID,
	)

	if err != nil {
		return fmt.Errorf("soft delete todo: %w", err)
	}

	return nil
}
