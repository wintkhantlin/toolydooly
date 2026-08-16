package main

import (
	"context"
	"database/sql"
	"fmt"
	"net/url"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/pgx"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/wintkhantlin/toolydooly/todo-service/internal/aws"
	"github.com/wintkhantlin/toolydooly/shared/aws/secrets"
)

func main() {
	ctx := context.Background()

	config, err := aws.NewAWSConfig()
	secret := secrets.New(config)

	if err != nil {
		panic(err)
	}

	var db secrets.Database

	if err := secrets.Get(*secret, ctx, "todo/db/master", &db); err != nil {
		panic(err)
	}

	dbURL := fmt.Sprintf(
		"postgres://%s:%s@%s:%d/%s?sslmode=disable",
		url.QueryEscape(db.Username),
		url.QueryEscape(db.Password),
		db.Host,
		db.Port,
		db.Database,
	)

	sqlDB, err := sql.Open("pgx", dbURL)
	if err != nil {
		panic(err)
	}
	defer sqlDB.Close()

	if err := sqlDB.PingContext(ctx); err != nil {
		panic(err)
	}

	conn, err := pgx.WithInstance(sqlDB, &pgx.Config{})
	if err != nil {
		panic(err)
	}
	defer conn.Close()

	m, err := migrate.NewWithDatabaseInstance(
		"file:///app/migrations",
		"postgres",
		conn,
	)
	if err != nil {
		panic(err)
	}
	defer m.Close()

	version, dirty, err := m.Version()

	if err != nil && err != migrate.ErrNilVersion {
		panic(err)
	}

	if dirty {
		fmt.Printf("Dirty migration detected at version %d\n", version)

		if version == 0 {
			if err := m.Force(0); err != nil {
				panic(err)
			}
		} else {
			if err := m.Force(int(version - 1)); err != nil {
				panic(err)
			}
		}

		fmt.Printf("Migration reset to version %d\n", version-1)
	}

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		panic(err)
	}

	fmt.Println("Database migration completed successfully")
}
