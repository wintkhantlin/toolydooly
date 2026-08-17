package main

import (
	"github.com/go-chi/chi/v5"
	"github.com/wintkhantlin/toolydooly/todo-service/internal"
	"github.com/wintkhantlin/toolydooly/todo-service/internal/aws"
	sharedaws "github.com/wintkhantlin/toolydooly/shared/aws"
	"github.com/wintkhantlin/toolydooly/shared/aws/congito"
	sharedqueue "github.com/wintkhantlin/toolydooly/shared/aws/queue"
	sharedsecrets "github.com/wintkhantlin/toolydooly/shared/aws/secrets"
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
			sharedaws.NewAWSConfig,

			sharedsecrets.New,

			sharedqueue.NewSQSClient,

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
