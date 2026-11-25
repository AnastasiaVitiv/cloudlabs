Лабораторна робота 3: Serverless-конвеєр опрацювання даних IoT-сенсорів
Архітектура проєкту
Повністю безсерверний конвеєр обробки телеметрії на базі AWS (API Gateway, Lambda, SQS + DLQ, RDS PostgreSQL, DynamoDB, S3), описаний декларативно у Terraform.

Публічна адреса приймача: 

Структура репозиторію
emulator/ багатопотоковий емулятор 4 датчиків (temperature, humidity, illuminance, camera) з Dockerfile.

functions/ код 4 serverless-функцій (ingest, processor, history, upload_url).

terraform/ IaC-опис усієї інфраструктури AWS.

docs/ архітектурна та технічна документація (ARCHITECTURE.md, INGEST.md, PROCESSING.md, DATA.md, DLQ.md, NOSQL.md, BLOB.md).
