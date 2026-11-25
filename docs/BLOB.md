
Обробка бінарних даних (Камера та S3)
Послідовність дій
sequenceDiagram
    participant Cam as Емулятор (Камера)
    participant API as API Gateway + UploadURL Lambda
    participant S3 as AWS S3 (Private Bucket)
    participant SQS as Ingest + SQS + Processor
    participant DB as PostgreSQL / DynamoDB
    participant Client as Клієнт історії

    Cam->>API: POST /sensors/upload-url
    API-->>Cam: {upload_url (PUT, 60s), object_key}
    Cam->>S3: HTTP PUT image.jpg (напряму)
    S3-->>Cam: 200 OK
    Cam->>SQS: POST /measurements (s3_key: object_key)
    SQS->>DB: Збереження запису з s3_key
    Client->>API: GET /sensors/sensor-cam-01/history
    API->>DB: Отримання записів
    API->>S3: Генерація Presigned GET URL (300s)
    API-->>Client: JSON з тимчасовим image_url
    
Чому бінарні дані не передають через чергу і не зберігають у БД?
Обмеження брокерів повідомлень: AWS SQS має жорсткий ліміт на розмір одного повідомлення — 256 КБ, тоді як знімок з камери сягає 1 МБ.

Вартість і продуктивність Compute: Прокачування мегабайтних файлів через Ingest та Processor Lambda збільшує споживання пам'яті та час виконання функцій (оплата за ГБ-секунди).

Деградація бази даних: Зберігання BLOB-об'єктів у PostgreSQL призводить до швидкого роздування дискового простору, уповільнення резервного копіювання та вимивання корисних індексів з оперативної пам'яті (Buffer Cache).

Що таке підписаний URL (Presigned URL)?
Це тимчасове посилання, криптографічно підписане ключами IAM-ролі за допомогою алгоритму AWS Signature Version 4. Воно делегує клієнту право виконати одну конкретну операцію (PUT для завантаження або GET для перегляду) над одним конкретним об'єктом у приватному S3-бакеті протягом обмеженого часу (60–300 секунд) без розкриття постійних облікових даних AWS.
