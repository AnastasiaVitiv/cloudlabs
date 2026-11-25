Архітектура конвеєра
```mermaid
flowchart LR
    E[IoT Емулятор] -->|1. POST /sensors/upload-url| AG[API Gateway HTTP API]
    AG --> UL[UploadURL Lambda]
    UL -->|Presigned PUT URL| E
    E -->|2. PUT JPEG| S3[(AWS S3 Bucket)]

    E -->|3. POST /measurements| AG
    AG --> IN[Ingest Lambda]
    IN -->|202 Accepted| E
    IN -->|Enqueue JSON| SQS[[AWS SQS Main Queue]]

    SQS -->|Batch Trigger| PR[Processor Lambda]
    SQS -.->|After 3 failures| DLQ[[AWS SQS DLQ]]

    PR -->|Raw JSON| DDB[(DynamoDB)]
    PR -->|Processed + Anomaly| RDS[(RDS PostgreSQL)]

    Client[REST Клієнт] -->|GET /sensors/id/history| AG
    AG --> HI[History Lambda]
    HI --> RDS
    HI --> DDB
    HI -.->|Presigned GET URL| S3
Призначення компонентів
API Gateway (HTTP API): Єдина публічна точка входу для прийому вимірювань, видачі посилань на завантаження файлів та запитів історії.

Ingest Lambda: Перевіряє заголовок x-api-key, валідує структуру JSON і передає повідомлення у чергу SQS.

AWS SQS (+ DLQ): Керована черга повідомлень, що буферизує потік подій від датчиків та гарантує доставку. Невдалі повідомлення після 3 спроб потрапляють у Dead-Letter Queue.

Processor Lambda: Обробляє батчі з черги, виконує валідацію фізичних меж, конвертацію одиниць, пошук аномалій і записує дані у БД.

RDS PostgreSQL: Реляційне сховище оброблених вимірювань з підтримкою складних аналітичних вибірок.

DynamoDB: NoSQL-сховище сирих подій для надшвидкого горизонтально масштабованого запису телеметрії.

AWS S3: Об'єктне сховище для бінарних знімків з датчика-камери.
