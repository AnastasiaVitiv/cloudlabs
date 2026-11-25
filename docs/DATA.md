
Збереження і читання історії
Схема реляційної бази даних (PostgreSQL)
Обрано єдину таблицю measurements замість окремих таблиць під кожен тип датчика:

90% полів (ідентифікатор, час, координати, сире значення, прапорець аномалії) є спільними для всіх сенсорів.

Специфічні атрибути (fahrenheit, light_level, s3_key) зберігаються у колонці metadata JSONB.

Додавання нового типу датчика (наприклад, camera) не потребує зміни схеми БД (ALTER TABLE).

CREATE TABLE IF NOT EXISTS measurements (
    id BIGSERIAL PRIMARY KEY,
    message_id VARCHAR(64),
    sensor_id VARCHAR(64) NOT NULL,
    sensor_type VARCHAR(32) NOT NULL,
    raw_value DOUBLE PRECISION NOT NULL,
    unit VARCHAR(16) NOT NULL,
    processed_value DOUBLE PRECISION,
    is_anomaly BOOLEAN DEFAULT FALSE,
    lat DOUBLE PRECISION NOT NULL,
    lon DOUBLE PRECISION NOT NULL,
    metadata JSONB,
    measured_at TIMESTAMPTZ NOT NULL,
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_sensor_time UNIQUE (sensor_id, measured_at)
);

CREATE INDEX IF NOT EXISTS idx_measurements_sensor_time
    ON measurements (sensor_id, measured_at DESC);
Складений індекс (sensor_id, measured_at DESC) дозволяє виконувати фільтрацію за датчиком та сортування у зворотному хронологічному порядку за допомогою швидкого Index Scan без сортування в пам'яті.

Приклад запиту історії та відповіді
curl -s -H "x-api-key: super-secret-iot-key-2026" \
  "$API_URL/sensors/sensor-temp-01/history?from=2026-11-21T00:00:00Z&to=2026-11-22T00:00:00Z&limit=2"
Відповідь:
{
  "source": "postgresql",
  "sensor_id": "sensor-temp-01",
  "count": 2,
  "items": [
    {
      "sensor_id": "sensor-temp-01",
      "sensor_type": "temperature",
      "raw_value": 24.5,
      "unit": "C",
      "processed_value": 76.1,
      "is_anomaly": false,
      "lat": 49.8397,
      "lon": 24.0297,
      "metadata": {"fahrenheit": 76.1},
      "measured_at": "2026-11-21T20:05:00+00:00"
    }
  ]
}
Підключення до БД та проблема ліміту з'єднань у Serverless
Функції підключаються до RDS PostgreSQL напряму через бібліотеку psycopg2.Чому кількість з'єднань є обмеженням: У PostgreSQL кожне TCP-з'єднання створює окремий процес ОС (~5–10 МБ RAM), і на малих інстансах (db.t4g.micro) ліміт становить ~80–100 з'єднань. Serverless-функції при піковому навантаженні можуть миттєво запустити сотні паралельних контейнерів, кожен з яких відкриє власне з'єднання, що призведе до відмови БД (FATAL: sorry, too many clients already).Як це вирішено в проєкті:

З'єднання conn винесено у глобальну область видимості Lambda для перевикористання між викликами ("теплі" старти).

На тригері SQS встановлено maximum_concurrency = 5, що жорстко обмежує максимальну кількість одночасних екземплярів processor.
