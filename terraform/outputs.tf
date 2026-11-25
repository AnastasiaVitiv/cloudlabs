output "api_endpoint" {
  description = "Публічна адреса HTTP-шлюзу"
  value       = aws_apigatewayv2_api.http_api.api_endpoint
}

output "sqs_main_queue_url" {
  description = "URL основної черги SQS"
  value       = aws_sqs_queue.main.id
}

output "sqs_dlq_url" {
  description = "URL черги недоставлених повідомлень (DLQ)"
  value       = aws_sqs_queue.dlq.id
}

output "rds_endpoint" {
  description = "Адреса інстансу PostgreSQL"
  value       = aws_db_instance.postgres.address
}

output "dynamodb_table" {
  description = "Ім'я таблиці DynamoDB"
  value       = aws_dynamodb_table.raw_measurements.name
}

output "s3_bucket" {
  description = "Ім'я S3-бакета для знімків"
  value       = aws_s3_bucket.snapshots.id
}
