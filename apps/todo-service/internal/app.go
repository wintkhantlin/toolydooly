package internal

import (
	"context"
	"net/http"

	"github.com/aws/aws-sdk-go-v2/service/sqs"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/wintkhantlin/toolydooly/todo-service/internal/aws"
	"github.com/wintkhantlin/toolydooly/todo-service/internal/handler"
	"go.uber.org/fx"
)

func RegisterApp(
	r *chi.Mux,
	queue *sqs.Client,
	appCfg *aws.AppConfig,
	handler *handler.Handler,
) {
	r.Use(middleware.Logger)

	r.Post("/", handler.CreateTodo)
	r.Get("/", handler.GetTodo)
	r.Put("/{id}", handler.UpdateTodo)
	r.Delete("/", handler.DeleteTodo)
}

func StartServer(lc fx.Lifecycle, server *http.Server) {
	lc.Append(fx.Hook{
		OnStart: func(ctx context.Context) error {
			go func() {
				err := server.ListenAndServe()
				if err != nil && err != http.ErrServerClosed {
					panic(err)
				}
			}()

			return nil
		},

		OnStop: func(ctx context.Context) error {
			return server.Shutdown(ctx)
		},
	})
}

func NewHTTPServer(r *chi.Mux) *http.Server {
	return &http.Server{
		Addr:    ":8001",
		Handler: r,
	}
}
