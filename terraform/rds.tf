resource "aws_db_subnet_group" "rds" {
  name       = "web1lab-rds-subnet-group"
  subnet_ids = [aws_subnet.private_1.id, aws_subnet.private_2.id]

  tags = {
    Name = "web1lab-rds-subnet-group"
  }
}

resource "aws_db_instance" "mysql" {
  allocated_storage     = 20
  max_allocated_storage = 20
  engine                = "mysql"
  engine_version        = "8.4.11"
  instance_class        = "db.t3.micro"

  db_name                     = var.db_name
  username                    = var.db_user
  manage_master_user_password = true

  db_subnet_group_name   = aws_db_subnet_group.rds.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  skip_final_snapshot = true
  publicly_accessible = false

  tags = {
    Name = "web1lab-mysql"
  }
}

resource "aws_secretsmanager_secret_rotation" "mysql" {
  secret_id        = aws_db_instance.mysql.master_user_secret[0].secret_arn
  rotation_enabled = false
}
