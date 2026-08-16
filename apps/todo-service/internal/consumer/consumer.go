package consumer

import "github.com/wintkhantlin/toolydooly/todo-service/internal/db"

type Consumer struct {
	db db.DBTX
}
