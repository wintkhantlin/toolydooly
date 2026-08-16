package main

import (
	"net/http"

	"github.com/wintkhantlin/toolydooly/realtime-service/internal"
	sharedaws "github.com/wintkhantlin/toolydooly/shared/aws"
	sharedcongito "github.com/wintkhantlin/toolydooly/shared/aws/congito"
	sharedqueue "github.com/wintkhantlin/toolydooly/shared/aws/queue"
	sharedsecrets "github.com/wintkhantlin/toolydooly/shared/aws/secrets"
	"go.uber.org/fx"
)

func main() {
	fx.New(
		fx.Provide(
			http.NewServeMux,
			internal.NewHub,
			sharedaws.NewAWSConfig,
			sharedsecrets.New,
			sharedqueue.NewSQSClient,
			sharedqueue.NewConfig,
			sharedcongito.NewCongitoVerifierInFx,
			internal.NewHTTPServer,
		),
		fx.Supply(sharedqueue.SecretName("realtime/sqs/master")),
		fx.Invoke(
			internal.RegisterApp,
			internal.StartServer,
			internal.StartQueueConsumer,
		),
	).Run()
}
