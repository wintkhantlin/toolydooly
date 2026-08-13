package handler

import (
	"github.com/aws/aws-sdk-go-v2/service/sqs"
	"github.com/go-playground/validator/v10"
	"github.com/wintkhantlin/toolydooly/todo-service/internal/aws"
	"github.com/wintkhantlin/toolydooly/todo-service/internal/db"
)

var validate = validator.New()

type Handler struct {
	Queue   *sqs.Client
	AppCfg  *aws.AppConfig
	Queries *db.Queries
}

func NewHandler(
	queue *sqs.Client,
	appCfg *aws.AppConfig,
	queries *db.Queries,
) *Handler {
	return &Handler{
		Queue:   queue,
		AppCfg:  appCfg,
		Queries: queries,
	}
}
