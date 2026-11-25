Черга недоставлених повідомлень (Dead-Letter Queue)
Налаштування у Terraform
Для основної черги aws_sqs_queue.main налаштовано redrive_policy з параметром maxReceiveCount = 3 та посиланням на окрему чергу aws_sqs_queue.dlq (час зберігання повідомлень — 14 днів). Якщо Processor Lambda повертає помилку 3 рази поспіль, SQS автоматично переміщує повідомлення в DLQ.

Демонстрація роботи
Надсилаємо коректне повідомлення з маркером збою обробки ("sensor_id": "poison-pill"):

curl -X POST "$API_URL/measurements" \
  -H "Content-Type: application/json" \
  -H "x-api-key: super-secret-iot-key-2026" \
  -d '{
    "sensor_id": "poison-pill",
    "sensor_type": "temperature",
    "value": 25.0,
    "unit": "C",
    "location": {"lat": 49.84, "lon": 24.03},
    "measured_at": "2026-11-21T20:10:00Z"
  }'
Ingest Lambda приймає його (202 Accepted), оскільки схема JSON валідна.

Processor Lambda 3 рази намагається обробити запис, викидає ValueError і повертає batchItemFailures. Решта валідних повідомлень у черзі продовжує успішно записуватися в БД.

Перевірка наявності повідомлення в DLQ через AWS CLI:

aws sqs receive-message --queue-url "$SQS_DLQ_URL"

Хто і як має розбирати DLQ?
Розбором займаються DevOps / Backend-інженери (on-call команда):

На метрику ApproximateNumberOfMessagesVisible > 0 для DLQ налаштовується CloudWatch Alarm зі сповіщенням у Slack/PagerDuty.

Інженер читає тіло повідомлення в DLQ та зіставляє його з логами CloudWatch Logs для Processor Lambda, щоб визначити першопричину (баг у коді обробника чи некоректні дані від конкретного датчика).

Якщо причина в багу коду — розгортається виправлення функції, після чого запускається вбудований механізм AWS SQS DLQ Redrive, який повертає повідомлення назад в основну чергу для повторної обробки. Якщо дані сміттєві — вони архівуються або видаляються.
