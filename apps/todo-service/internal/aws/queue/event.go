package queue

import (
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/sqs"
	sharedqueue "github.com/wintkhantlin/toolydooly/shared/aws/queue"
)

type ActionState = sharedqueue.ActionState

const (
	TodoCreate = sharedqueue.TodoCreate
	TodoDelete = sharedqueue.TodoDelete
	TodoUpdate = sharedqueue.TodoUpdate
)

type TodoEvent = sharedqueue.TodoEvent

type TodoPayload = sharedqueue.TodoPayload

func ParseTodoEvent(body []byte) (TodoEvent, error) {
	return sharedqueue.ParseTodoEvent(body)
}

func ExtractUserID(body []byte) (string, bool) {
	return sharedqueue.ExtractUserID(body)
}

func NewSQSClient(config *aws.Config) (*sqs.Client, error) {
	return sharedqueue.NewSQSClient(config)
}
