package aws

import (
	"context"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
)

func NewAWSConfig() (*aws.Config, error) {
	ctx := context.Background()
	Region := getEnv("AWS_REGION", "us-east-1")
	AccessKey := getEnv("AWS_ACCESS_KEY_ID", "ministack")
	SecretKey := getEnv("AWS_SECRET_ACCESS_KEY", "ministack")
	Endpoint := getEnv("AWS_ENDPOINT_URL", "http://ministack:4566")

	awsCfg, err := config.LoadDefaultConfig(
		ctx,
		config.WithRegion(Region),
		config.WithCredentialsProvider(
			credentials.NewStaticCredentialsProvider(
				AccessKey,
				SecretKey,
				"",
			),
		),
		config.WithBaseEndpoint(Endpoint),
	)
	if err != nil {
		return nil, err
	}

	return &awsCfg, nil
}
