resource "aws_ecr_repository" "app" {
  name                 = "web1lab-app"
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = false
  }

  tags = {
    Name        = "web1lab-app"
    Environment = "lab"
    ManagedBy   = "terraform"
  }
}
