package internal

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/coder/websocket"
	sharedcongito "github.com/wintkhantlin/toolydooly/shared/aws/congito"
	"go.uber.org/fx"
)

const defaultListenAddr = ":8002"

func RegisterApp(
	mux *http.ServeMux,
	verifier *sharedcongito.CognitoVerifier,
	hub *Hub,
) {
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		w.WriteHeader(http.StatusOK)
	})

	mux.Handle("/ws", handleWebSocket(verifier, hub))
}

func StartServer(lc fx.Lifecycle, server *http.Server) {
	lc.Append(fx.Hook{
		OnStart: func(ctx context.Context) error {
			go func() {
				if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
					log.Printf("realtime-service listen failed: %v", err)
				}
			}()

			return nil
		},
		OnStop: func(ctx context.Context) error {
			return server.Shutdown(ctx)
		},
	})
}

func NewHTTPServer(mux *http.ServeMux) *http.Server {
	return &http.Server{
		Addr:    listenAddr(),
		Handler: mux,
	}
}

func listenAddr() string {
	if addr := strings.TrimSpace(os.Getenv("REALTIME_SERVICE_ADDR")); addr != "" {
		return addr
	}

	return defaultListenAddr
}

func handleWebSocket(
	verifier *sharedcongito.CognitoVerifier,
	hub *Hub,
) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		raw_token, err := sharedcongito.ExtractBearerToken(r)
		if err != nil {
			http.Error(w, err.Error(), http.StatusUnauthorized)
			return
		}

		claims, err := verifier.Validate(raw_token)
		if err != nil {
			http.Error(w, "invalid cognito token", http.StatusUnauthorized)
			return
		}

		conn, err := websocket.Accept(w, r, &websocket.AcceptOptions{
			InsecureSkipVerify: true,
		})
		if err != nil {
			return
		}
		defer conn.CloseNow()

		ctx, cancel := context.WithCancel(r.Context())
		defer cancel()

		client := NewClient(conn)
		hub.Register(claims.Subject, client)
		defer hub.Unregister(claims.Subject, client)

		go client.WriteLoop(ctx)

		for {
			_, _, err := conn.Read(ctx)
			if err != nil {
				if websocket.CloseStatus(err) == websocket.StatusNormalClosure {
					return
				}

				return
			}
		}
	}
}
