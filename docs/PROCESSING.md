# Обробка даних функціями (Processing)

## Потік даних від емулятора до бази
```text
[Emulator] --POST--> [API Gateway] --> [Ingest Lambda] --> [AWS SQS Queue]
                                                                 | (Batch up to 10)
                                                                 v
[RDS PostgreSQL] <--INSERT (ON CONFLICT)-- [Processor Lambda] --TransactWriteItems--> [DynamoDB]
                                                  | (on 3x failure)
                                                  v
                                            [AWS SQS DLQ]
Обґрунтування вибору дизайну (одна функція-диспетчер)
Використано єдину функцію-диспетчер (Processor Lambda), яка зчитує батчі до 10 повідомлень із черги SQS та розгалужує логіку за полем sensor_type:

temperature: валідація фізичних меж датчика [-60..100] °C, перерахунок у градуси Фаренгейта (°C * 1.8 + 32) та позначення аномалії (is_anomaly = true при значенні > 40°C або < -10°C).

humidity: перевірка діапазону [0..100] %, обчислення відхилення від комфортної норми 50% та позначення аномалії при > 85% або < 15%.

illuminance: перевірка невід'ємності (>= 0 lux), класифікація рівня освітлення (dark, indoor, bright_daylight) та позначення аномалії при > 900 lux.

camera: перевірка наявності s3_key, перевірка обмеження розміру до 1 МБ (1048576 байт) та збереження посилання на знімок у metadata.

Забезпечення ідемпотентності
Глобальна дедуплікація в DynamoDB (TransactWriteItems): виконується атомарна транзакція з двох операцій Put: створюється маркер sensor_id = "EVENT#<event_id>" за умови attribute_not_exists(sensor_id) і одночасно записується вимірювання (sensor_id, measured_at). Якщо транзакція скасована виключно через ConditionalCheckFailed першого елемента, дублікат ігнорується; інші помилки передаються далі.

Унікальне обмеження в PostgreSQL: колонка event_id VARCHAR(64) NOT NULL має обмеження UNIQUE (event_id), а вставка виконується через ON CONFLICT (event_id) DO NOTHING.

Обробка збоїв (Partial Batch Response)
Функція повертає batchItemFailures із messageId лише тих записів батчу, обробка яких завершилася винятком. Після 3 невдалих спроб SQS переміщує повідомлення у DLQ.
