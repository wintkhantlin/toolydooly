package aws

import (
	"context"
	"os"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
)

func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}

	return defaultValue
}

func NewAWSConfig() (*aws.Config, error) {
	ctx := context.Background()
	region := getEnv("AWS_REGION", "us-east-1")
	accessKey := getEnv("AWS_ACCESS_KEY_ID", "ministack")
	secretKey := getEnv("AWS_SECRET_ACCESS_KEY", "ministack")
	endpoint := getEnv("AWS_ENDPOINT_URL", "http://ministack:4566")

	awsCfg, err := config.LoadDefaultConfig(
		ctx,
		config.WithRegion(region),
		config.WithCredentialsProvider(
			credentials.NewStaticCredentialsProvider(
				accessKey,
				secretKey,
				"",
			),
		),
		config.WithBaseEndpoint(endpoint),
	)
	if err != nil {
		return nil, err
	}

	return &awsCfg, nil
}
