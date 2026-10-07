variable "aws_region" {
  type    = string
  default = "eu-central-1"
}

variable "db_name" {
  type    = string
  default = "ship_catalog"
}

variable "db_user" {
  type    = string
  default = "ship_user"
}

variable "db_password" {
  type        = string
  sensitive   = true
  description = "Пароль до бази даних MySQL"
}

variable "budget_email" {
  type        = string
  description = "Email для AWS Budget notifications"
}

variable "monthly_budget_usd" {
  type    = number
  default = 10
}
