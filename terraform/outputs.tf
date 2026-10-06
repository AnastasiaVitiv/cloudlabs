output "alb_dns_name" {
  description = "Публічний URL балансувальника"
  value       = "http://${aws_lb.main.dns_name}"
}

output "ecr_repository_url" {
  description = "URL ECR реєстру"
  value       = aws_ecr_repository.app.repository_url
}
