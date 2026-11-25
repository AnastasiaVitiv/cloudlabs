# Лабораторна робота 3: Serverless-конвеєр опрацювання даних IoT-сенсорів

## Публічна адреса приймача
* **Base URL (HTTP API Gateway):** `https://abh7mxqkqc.execute-api.eu-central-1.amazonaws.com`
* **Прийом вимірювань:** `POST https://abh7mxqkqc.execute-api.eu-central-1.amazonaws.com/measurements`
* **Отримання Presigned URL (камера):** `POST https://abh7mxqkqc.execute-api.eu-central-1.amazonaws.com/sensors/upload-url`
* **Історія вимірювань:** `GET https://abh7mxqkqc.execute-api.eu-central-1.amazonaws.com/sensors/{sensor_id}/history`

## Архітектура проєкту
Повністю безсерверний конвеєр обробки телеметрії на базі **AWS (API Gateway, Lambda, SQS + DLQ, RDS PostgreSQL, DynamoDB, S3)**, описаний декларативно у **Terraform**.

1. Емулятор генерує дані з 4 датчиків (`temperature`, `humidity`, `illuminance`, `camera`) з інтервалом 50–90 мс (та 10–30 с для камери).
2. Датчик-камера завантажує знімки напряму в приватний бакет **AWS S3** за одноразовим `Presigned PUT URL`, після чого надсилає лише метадані (`s3_key`).
3. **API Gateway** передає запити в **Ingest Lambda**, яка перевіряє `x-api-key`, валідує JSON та ставить повідомлення в чергу **AWS SQS** (`202 Accepted`).
4. **Processor Lambda** читає батчі з черги, виконує перевірку діапазонів, перерахунок одиниць, пошук аномалій і ідемпотентно зберігає дані в **DynamoDB** (сирі) та **RDS PostgreSQL** (оброблені). Некоректні повідомлення після 3 невдалих спроб потрапляють у **Dead-Letter Queue (DLQ)**.
5. **History Lambda** повертає історію за `sensor_id` та часовим діапазоном із PostgreSQL або DynamoDB (`?source=nosql`), генеруючи тимчасові `Presigned GET URL` для знімків камери.

## Структура репозиторію
* `emulator/` — багатопотоковий емулятор 4 датчиків із `Dockerfile` та інструкцією запуску.
* `functions/` — код 4 serverless-функцій (`ingest`, `processor`, `history`, `upload_url`).
* `terraform/` — IaC-опис усієї хмарної інфраструктури AWS.
* `docs/` — архітектурна та технічна документація (`ARCHITECTURE.md`, `INGEST.md`, `PROCESSING.md`, `DATA.md`, `DLQ.md`, `NOSQL.md`, `BLOB.md`).

## Швидкий старт
1. **Розгортання інфраструктури:**
   ```bash
   cd terraform
   export TF_VAR_api_key="super-secret-iot-key-2026"
   export TF_VAR_db_password="StrongPassword123!"
   terraform init && terraform apply -auto-approve


# Лабораторна робота 3: Serverless-конвеєр опрацювання даних IoT-сенсорів

## Публічна адреса приймача
* **Base URL (HTTP API Gateway):** `https://abh7mxqkqc.execute-api.eu-central-1.amazonaws.com`
* **Прийом вимірювань:** `POST https://abh7mxqkqc.execute-api.eu-central-1.amazonaws.com/measurements`
* **Отримання Presigned URL (камера):** `POST https://abh7mxqkqc.execute-api.eu-central-1.amazonaws.com/sensors/upload-url`
* **Історія вимірювань:** `GET https://abh7mxqkqc.execute-api.eu-central-1.amazonaws.com/sensors/{sensor_id}/history`

## Архітектура проєкту
Повністю безсерверний конвеєр обробки телеметрії на базі **AWS (API Gateway, Lambda, SQS + DLQ, RDS PostgreSQL, DynamoDB, S3)**, описаний декларативно у **Terraform**.

1. Емулятор генерує дані з 4 датчиків (`temperature`, `humidity`, `illuminance`, `camera`) з інтервалом 50–90 мс (та 10–30 с для камери).
2. Датчик-камера завантажує знімки напряму в приватний бакет **AWS S3** за одноразовим `Presigned PUT URL`, після чого надсилає лише метадані (`s3_key`).
3. **API Gateway** передає запити в **Ingest Lambda**, яка перевіряє `x-api-key`, валідує JSON та ставить повідомлення в чергу **AWS SQS** (`202 Accepted`).
4. **Processor Lambda** читає батчі з черги, виконує перевірку діапазонів, перерахунок одиниць, пошук аномалій і ідемпотентно зберігає дані в **DynamoDB** (сирі) та **RDS PostgreSQL** (оброблені). Некоректні повідомлення після 3 невдалих спроб потрапляють у **Dead-Letter Queue (DLQ)**.
5. **History Lambda** повертає історію за `sensor_id` та часовим діапазоном із PostgreSQL або DynamoDB (`?source=nosql`), генеруючи тимчасові `Presigned GET URL` для знімків камери.

## Структура репозиторію
* `emulator/` — багатопотоковий емулятор 4 датчиків із `Dockerfile` та інструкцією запуску.
* `functions/` — код 4 serverless-функцій (`ingest`, `processor`, `history`, `upload_url`).
* `terraform/` — IaC-опис усієї хмарної інфраструктури AWS.
* `docs/` — архітектурна та технічна документація (`ARCHITECTURE.md`, `INGEST.md`, `PROCESSING.md`, `DATA.md`, `DLQ.md`, `NOSQL.md`, `BLOB.md`).

## Швидкий старт
1. **Розгортання інфраструктури:**
   ```bash
   cd terraform
   export TF_VAR_api_key="super-secret-iot-key-2026"
   export TF_VAR_db_password="StrongPassword123!"
   terraform init && terraform apply -auto-approve
