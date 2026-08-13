package handler

import (
	"errors"
	"net/http"
	"strings"

	"github.com/aws/aws-sdk-go-v2/service/sqs"
	"github.com/go-playground/validator/v10"
	"github.com/wintkhantlin/toolydooly/todo-service/internal/aws"
	"github.com/wintkhantlin/toolydooly/todo-service/internal/db"
)

var validate = validator.New()

var (
	ErrMissingAuthorization = errors.New("missing authorization header")
	ErrInvalidAuthorization = errors.New("invalid authorization header")
)

func ExtractBearerToken(r *http.Request) (string, error) {
	header := r.Header.Get("Authorization")
	if header == "" {
		return "", ErrMissingAuthorization
	}

	parts := strings.Fields(header)

	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return "", ErrInvalidAuthorization
	}

	token := parts[1]

	if token == "" {
		return "", ErrInvalidAuthorization
	}

	return token, nil
}

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
