package db

import (
	"github.com/jackc/pgx/v5/pgxpool"
)

func NewDBTX(db *pgxpool.Pool) DBTX {
	return db
}
