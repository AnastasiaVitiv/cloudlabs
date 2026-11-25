resource "null_resource" "build_processor_pkg" {
  triggers = {
    handler_hash = filemd5("${path.module}/../functions/processor/handler.py")
  }
  provisioner "local-exec" {
    command = <<EOT
      rm -rf /tmp/lambda_processor && mkdir -p /tmp/lambda_processor
      cp ${path.module}/../functions/processor/handler.py /tmp/lambda_processor/
      docker run --rm -v /tmp/lambda_processor:/out python:3.11.10-slim-bookworm pip install --target=/out psycopg2-binary==2.9.9
    EOT
  }
}

resource "null_resource" "build_history_pkg" {
  triggers = {
    handler_hash = filemd5("${path.module}/../functions/history/handler.py")
  }
  provisioner "local-exec" {
    command = <<EOT
      rm -rf /tmp/lambda_history && mkdir -p /tmp/lambda_history
      cp ${path.module}/../functions/history/handler.py /tmp/lambda_history/
      docker run --rm -v /tmp/lambda_history:/out python:3.11.10-slim-bookworm pip install --target=/out psycopg2-binary==2.9.9
    EOT
  }
}

data "archive_file" "ingest_zip" {
  type        = "zip"
  source_file = "${path.module}/../functions/ingest/handler.py"
  output_path = "/tmp/ingest.zip"
}

data "archive_file" "upload_url_zip" {
  type        = "zip"
  source_file = "${path.module}/../functions/upload_url/handler.py"
  output_path = "/tmp/upload_url.zip"
}

data "archive_file" "processor_zip" {
  depends_on  = [null_resource.build_processor_pkg]
  type        = "zip"
  source_dir  = "/tmp/lambda_processor"
  output_path = "/tmp/processor.zip"
}

data "archive_file" "history_zip" {
  depends_on  = [null_resource.build_history_pkg]
  type        = "zip"
  source_dir  = "/tmp/lambda_history"
  output_path = "/tmp/history.zip"
}

resource "aws_lambda_function" "ingest" {
  filename         = data.archive_file.ingest_zip.output_path
  source_code_hash = data.archive_file.ingest_zip.output_base64sha256
  function_name    = "${var.project_name}-ingest"
  role             = aws_iam_role.ingest_role.arn
  handler          = "handler.lambda_handler"
  runtime          = "python3.11"
  timeout          = 10

  environment {
    variables = {
      QUEUE_URL = aws_sqs_queue.main.id
      API_KEY   = var.api_key
    }
  }
}

resource "aws_lambda_function" "processor" {
  filename         = data.archive_file.processor_zip.output_path
  source_code_hash = data.archive_file.processor_zip.output_base64sha256
  function_name    = "${var.project_name}-processor"
  role             = aws_iam_role.processor_role.arn
  handler          = "handler.lambda_handler"
  runtime          = "python3.11"
  timeout          = 20

  vpc_config {
    subnet_ids         = data.aws_subnets.default.ids
    security_group_ids = [aws_security_group.lambda_sg.id]
  }

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.raw_measurements.name
      DB_HOST        = aws_db_instance.postgres.address
      DB_PORT        = "5432"
      DB_NAME        = aws_db_instance.postgres.db_name
      DB_USER        = aws_db_instance.postgres.username
      DB_PASSWORD    = var.db_password
    }
  }
}

resource "aws_lambda_event_source_mapping" "sqs_trigger" {
  event_source_arn        = aws_sqs_queue.main.arn
  function_name           = aws_lambda_function.processor.arn
  batch_size              = 10
  function_response_types = ["ReportBatchItemFailures"]

  scaling_config {
    maximum_concurrency = 5
  }
}

resource "aws_lambda_function" "history" {
  filename         = data.archive_file.history_zip.output_path
  source_code_hash = data.archive_file.history_zip.output_base64sha256
  function_name    = "${var.project_name}-history"
  role             = aws_iam_role.history_role.arn
  handler          = "handler.lambda_handler"
  runtime          = "python3.11"
  timeout          = 15

  vpc_config {
    subnet_ids         = data.aws_subnets.default.ids
    security_group_ids = [aws_security_group.lambda_sg.id]
  }

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.raw_measurements.name
      S3_BUCKET      = aws_s3_bucket.snapshots.id
      API_KEY        = var.api_key
      DB_HOST        = aws_db_instance.postgres.address
      DB_PORT        = "5432"
      DB_NAME        = aws_db_instance.postgres.db_name
      DB_USER        = aws_db_instance.postgres.username
      DB_PASSWORD    = var.db_password
    }
  }
}

resource "aws_lambda_function" "upload_url" {
  filename         = data.archive_file.upload_url_zip.output_path
  source_code_hash = data.archive_file.upload_url_zip.output_base64sha256
  function_name    = "${var.project_name}-upload-url"
  role             = aws_iam_role.upload_url_role.arn
  handler          = "handler.lambda_handler"
  runtime          = "python3.11"
  timeout          = 10

  environment {
    variables = {
      S3_BUCKET = aws_s3_bucket.snapshots.id
      API_KEY   = var.api_key
    }
  }
}
