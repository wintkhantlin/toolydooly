package main

import (
	"github.com/go-chi/chi/v5"
	"github.com/wintkhantlin/toolydooly/todo-service/internal"
	"github.com/wintkhantlin/toolydooly/todo-service/internal/aws"
	"github.com/wintkhantlin/toolydooly/todo-service/internal/aws/congito"
	"github.com/wintkhantlin/toolydooly/todo-service/internal/aws/queue"
	"github.com/wintkhantlin/toolydooly/todo-service/internal/aws/secrets"
	"github.com/wintkhantlin/toolydooly/todo-service/internal/consumer"
	"github.com/wintkhantlin/toolydooly/todo-service/internal/db"
	"github.com/wintkhantlin/toolydooly/todo-service/internal/handler"
	"go.uber.org/fx"
)

func main() {
	fx.New(
		fx.Provide(
			chi.NewRouter,
			aws.NewAppConfig,
			aws.NewAWSConfig,

			secrets.New,

			queue.NewSQSClient,

			db.NewDatabase,
			db.NewDBTX,
			db.New,

			congito.NewCongitoVerifierInFx,

			internal.NewHTTPServer,

			handler.NewHandler,
		),
		fx.Invoke(
			internal.RegisterApp,
			internal.StartServer,
			consumer.StartTodoConsumer,
		),
	).Run()
}
