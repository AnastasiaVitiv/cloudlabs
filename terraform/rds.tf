resource "aws_db_subnet_group" "rds" {
  name       = "web1lab-rds-subnet-group"
  subnet_ids = [aws_subnet.private_1.id, aws_subnet.private_2.id]

  tags = { Name = "web1lab-rds-subnet-group" }
}

resource "aws_db_instance" "mysql" {
  allocated_storage      = 20
  max_allocated_storage  = 20
  engine                 = "mysql"
  engine_version         = "8.0"
  instance_class         = "db.t3.micro"
  db_name                = var.db_name
  username               = var.db_user
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.rds.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  skip_final_snapshot    = true
  publicly_accessible    = false

  tags = { Name = "web1lab-mysql" }
}
