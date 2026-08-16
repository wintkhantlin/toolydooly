package db

import (
	"context"
	"fmt"
	"net/url"

	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/wintkhantlin/toolydooly/shared/aws/secrets"
	"go.uber.org/fx"
)

func NewDatabase(lc fx.Lifecycle, s *secretsmanager.Client) (*pgxpool.Pool, error) {
	var database secrets.Database

	if err := secrets.Get(*s, context.Background(), "todo/db/master", &database); err != nil {
		return nil, err
	}

	dbURL := fmt.Sprintf(
		"postgres://%s:%s@%s:%d/%s?sslmode=disable",
		url.QueryEscape(database.Username),
		url.QueryEscape(database.Password),
		database.Host,
		database.Port,
		database.Database,
	)

	pool, err := pgxpool.New(context.Background(), dbURL)
	if err != nil {
		return nil, err
	}

	lc.Append(fx.Hook{
		OnStart: func(ctx context.Context) error {
			return pool.Ping(ctx)
		},
		OnStop: func(ctx context.Context) error {
			pool.Close()
			return nil
		},
	})

	return pool, nil
}
