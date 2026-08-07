terraform {
  required_providers {
    aws = {
      version = ">= 2.7.0"
      source  = "hashicorp/aws"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

resource "aws_db_instance" "todo_database" {
  allocated_storage          = 5
  auto_minor_version_upgrade = false
  engine                     = "postgres"
  engine_version             = "17.3"

  username                   = "root"
  manage_master_user_password = true

  instance_class              = "db.t3.micro"
  allow_major_version_upgrade = false
}

output "todo_database_secret_arn" {
  value = aws_db_instance.todo_database.master_user_secret[0].secret_arn
}

resource "aws_elasticache_cluster" "todo_cache" {
  cluster_id      = "todo-cache"
  engine          = "redis"
  engine_version  = "3.2.10"
  node_type       = "cache.t3.micro"
  num_cache_nodes = 1
  port            = 6379
}

resource "aws_sqs_queue" "todo_queue" {
  count                       = 1
  fifo_queue                  = true
  content_based_deduplication = true
}

output "db_instance_endpoint" {
  value = aws_db_instance.todo_database.endpoint
}

output "cache_endpoint" {
  value = aws_elasticache_cluster.todo_cache.cache_nodes[0].address
}

output "sqs_queue_url" {
  value = aws_sqs_queue.todo_queue[0].id
}

output "sqs_queue_arn" {
  value = aws_sqs_queue.todo_queue[0].arn
}
