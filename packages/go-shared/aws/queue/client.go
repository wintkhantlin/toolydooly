package queue

import (
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/sqs"
)

func NewSQSClient(cfg *aws.Config) (*sqs.Client, error) {
	client := sqs.NewFromConfig(*cfg)
	return client, nil
}
