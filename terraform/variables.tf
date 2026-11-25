variable "aws_region" {
  description = "AWS регіон для розгортання"
  type        = string
  default     = "eu-central-1"
}

variable "project_name" {
  description = "Префікс імен ресурсів (дозволений IAM-політикою)"
  type        = string
  default     = "web1lab-iot"
}

variable "api_key" {
  description = "Секретний ключ доступу x-api-key"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Пароль до PostgreSQL"
  type        = string
  sensitive   = true
}
