terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.57.1"
    }

    random = {
      source  = "hashicorp/random"
      version = "~> 3.7"
    }
  }
}

provider "aws" {
  region     = "us-east-1"
  access_key = "test"
  secret_key = "test"

  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true
}

resource "aws_vpc" "toolydooly" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_subnet" "todo" {
  vpc_id     = aws_vpc.toolydooly.id
  cidr_block = "10.0.1.0/24"
}

resource "aws_db_subnet_group" "todo_subnet_group" {
  name = "todo-subnet-group"
  subnet_ids = [
    aws_subnet.todo.id
  ]
}

resource "random_password" "db_password" {
  length = 24
}

resource "aws_db_instance" "db" {
  allocated_storage = 5
  engine            = "postgres"
  engine_version    = "17.3"
  instance_class    = "db.t3.micro"

  db_name  = "todo_db"
  username = "postgres"
  password = random_password.db_password.result

  port = 5432

  db_subnet_group_name = aws_db_subnet_group.todo_subnet_group.name

  publicly_accessible = true
  multi_az            = false

  backup_retention_period = 7
  deletion_protection     = false

  skip_final_snapshot = true
}

resource "aws_secretsmanager_secret" "db" {
  name = "todo/db/master"
}

resource "aws_secretsmanager_secret_version" "db" {
  secret_id = aws_secretsmanager_secret.db.id

  secret_string = jsonencode({
    host     = aws_db_instance.db.address
    port     = 5432 # was: aws_db_instance.db.port
    database = aws_db_instance.db.db_name
    username = aws_db_instance.db.username
    password = random_password.db_password.result
  })
}

resource "aws_sqs_queue" "queue" {
  name = "todo-queue.fifo"

  fifo_queue                  = true
  content_based_deduplication = true
}

resource "aws_secretsmanager_secret" "todo_sqs" {
  name = "todo/sqs/master"
}

resource "aws_secretsmanager_secret_version" "todo_sqs" {
  secret_id = aws_secretsmanager_secret.todo_sqs.id

  depends_on = [
    aws_sqs_queue.queue
  ]

  secret_string = jsonencode({
    queue_url = replace(
      aws_sqs_queue.queue.url,
      "localhost",
      "ministack"
    )
    queue_arn = aws_sqs_queue.queue.arn
    region    = "us-east-1"
  })
}

## Congito

resource "aws_cognito_user_pool" "auth" {
  name = "authentication"

  username_attributes = ["email"]

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_uppercase = true
    require_symbols   = true
  }
}

resource "aws_cognito_user_pool_client" "api" {
  name         = "api"
  user_pool_id = aws_cognito_user_pool.auth.id

  generate_secret = false
}

## API Gateway

resource "aws_apigatewayv2_api" "app" {
  name          = "app"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["Authorization", "Content-Type"]
  }
}

resource "aws_apigatewayv2_authorizer" "cognito" {
  name = "api-gateway"
  api_id           = aws_apigatewayv2_api.app.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]

  jwt_configuration {
    audience = [
      aws_cognito_user_pool_client.api.id
    ]

    issuer = "http://ministack:8000/${aws_cognito_user_pool.auth.id}"
  }
}

resource "aws_apigatewayv2_integration" "todo-service" {
  api_id = aws_apigatewayv2_api.app.id

  integration_type = "PROXY"
  integration_uri = "http://todo-service:8001"
}

output "db_secret_arn" {
  value = aws_secretsmanager_secret.db.arn
}

output "db_endpoint" {
  value = aws_db_instance.db.endpoint
}

output "queue_url" {
  value = aws_sqs_queue.queue.url
}
