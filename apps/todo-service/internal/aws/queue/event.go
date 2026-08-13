package queue

import (
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/sqs"
)

func NewSQSClient(config *aws.Config) (*sqs.Client, error) {
	sqs := sqs.NewFromConfig(*config)

	return sqs, nil
}
