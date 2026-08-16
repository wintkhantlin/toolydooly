package internal

import (
	"context"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/wintkhantlin/toolydooly/todo-service/internal/aws"
	"github.com/wintkhantlin/toolydooly/shared/aws/congito"
	"github.com/wintkhantlin/toolydooly/todo-service/internal/handler"
	m "github.com/wintkhantlin/toolydooly/todo-service/internal/middleware"
	"go.uber.org/fx"
)

func RegisterApp(
	r *chi.Mux,
	appCfg *aws.AppConfig,
	handler *handler.Handler,
	verifier *congito.CognitoVerifier,
) {
	r.Use(middleware.Logger)
	r.Use(func(next http.Handler) http.Handler {
		return m.AuthMiddleware(verifier, next)
	})

	r.Route("/todos", func(r chi.Router) {
		r.Post("/", handler.CreateTodo)
		r.Get("/", handler.GetTodo)
		r.Put("/{id}", handler.UpdateTodo)
		r.Delete("/{id}", handler.DeleteTodo)
	})
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
