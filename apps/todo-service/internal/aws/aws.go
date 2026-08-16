package aws

import (
	sharedaws "github.com/wintkhantlin/toolydooly/shared/aws"
	awssdk "github.com/aws/aws-sdk-go-v2/aws"
)

func NewAWSConfig() (*awssdk.Config, error) {
	return sharedaws.NewAWSConfig()
}
