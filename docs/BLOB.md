Бінарні дані в об'єктному сховищі (S3 + Presigned URLs)
Послідовність дій (Sequence Diagram)
sequenceDiagram
    participant Cam as Camera Sensor (Emulator)
    participant API as API Gateway + UploadURL Lambda
    participant S3 as Private AWS S3 Bucket
    participant Ingest as Ingest Lambda + SQS
    participant Proc as Processor Lambda
    participant DB as PostgreSQL / DynamoDB

    Cam->>API: POST /sensors/upload-url (sensor_id, content_length <= 1MB)
    API-->>Cam: 200 OK (presigned PUT URL, object_key)
    Cam->>S3: HTTP PUT image/jpeg (напряму в S3 за Presigned URL)
    S3-->>Cam: 200 OK
    Cam->>Ingest: POST /measurements (sensor_type="camera", s3_key)
    Ingest-->>Cam: 202 Accepted
    Ingest->>Proc: SQS Trigger
    Proc->>DB: Зберігає метадані та s3_key (без бінарного файлу)
Чому бінарні дані не передають через чергу і не зберігають у базі?
Обмеження черг повідомлень: AWS SQS має жорсткий ліміт розміру повідомлення (256 КБ), тоді як знімок камери сягає 1 МБ. Кодування у Base64 збільшує обсяг ще на ~33%.

Деградація продуктивності БД: зберігання великих BLOB-об'єктів у реляційній БД роздуває розмір таблиць, уповільнює резервне копіювання, вимиває кеш оперативної пам'яті (shared_buffers) та коштує значно дорожче за об'єктне сховище S3.

Що таке підписаний URL (Presigned URL)?
Це тимчасове посилання, криптографічно підписане ключами IAM-ролі Lambda (AWS Signature Version 4), яке надає клієнту обмежений у часі доступ (ExpiresIn = 60 секунд для PUT та 300 секунд для GET) до конкретного об'єкта у приватному S3-бакеті без розкриття облікових даних AWS та без відкриття публічного доступу до бакета.
