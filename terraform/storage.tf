resource "random_id" "suffix" {
  byte_length = 4
}

resource "aws_db_instance" "postgres" {
  identifier             = "${var.project_name}-db"
  engine                 = "postgres"
  engine_version         = "16"
  instance_class         = "db.t4g.micro"
  allocated_storage      = 20
  storage_type           = "gp3"
  db_name                = "iotdb"
  username               = "iotadmin"
  password               = var.db_password
  publicly_accessible    = true
  skip_final_snapshot    = true
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
}

resource "aws_dynamodb_table" "raw_measurements" {
  name         = "${var.project_name}-raw"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "sensor_id"
  range_key    = "measured_at"

  attribute {
    name = "sensor_id"
    type = "S"
  }

  attribute {
    name = "measured_at"
    type = "S"
  }
}

resource "aws_s3_bucket" "snapshots" {
  bucket        = "${var.project_name}-snapshots-${random_id.suffix.hex}"
  force_destroy = true
}

resource "aws_s3_bucket_public_access_block" "snapshots_block" {
  bucket                  = aws_s3_bucket.snapshots.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "cleanup" {
  bucket = aws_s3_bucket.snapshots.id
  rule {
    id     = "expire-old-snapshots"
    status = "Enabled"
    filter {}
    expiration {
      days = 1
    }
  }
}
