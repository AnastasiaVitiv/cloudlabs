# Черга недоставлених повідомлень (Dead-Letter Queue)

## Налаштування у Terraform
Для основної черги `aws_sqs_queue.main` налаштовано `redrive_policy` з параметром `maxReceiveCount = 3` та посиланням на окрему чергу `aws_sqs_queue.dlq` (час зберігання повідомлень — 14 днів). Якщо `Processor Lambda` повертає помилку 3 рази поспіль, SQS автоматично переміщує повідомлення в DLQ.

Для моніторингу створено `CloudWatch Metric Alarm` (`web1lab-iot-dlq-messages-alarm`), який відстежує `ApproximateNumberOfMessagesVisible > 0` та публікує подію в тему `AWS SNS` (`web1lab-iot-dlq-alerts`). У рамках навчальної лабораторної роботи активна email- чи Slack-підписка до SNS-теми не підключалася (щоб не зберігати персональні email-адреси чи вебхуки в репозиторії), проте інфраструктура готова до підключення будь-якого отримувача сповіщень.

## Демонстрація роботи
1. Надсилаємо коректне за схемою повідомлення, яке викликає помилку бізнес-логіки при обробці (`"sensor_id": "poison-pill"`):
```bash
curl -i -X POST "[https://abh7mxqkqc.execute-api.eu-central-1.amazonaws.com/measurements](https://abh7mxqkqc.execute-api.eu-central-1.amazonaws.com/measurements)" \
  -H "Content-Type: application/json" \
  -H "x-api-key: <YOUR_API_KEY>" \
  -d '{
    "sensor_id": "poison-pill",
    "sensor_type": "temperature",
    "value": 25,
    "unit": "C",
    "location": {"lat": 49.84, "lon": 24.03},
    "measured_at": "2026-11-25T11:15:00Z"
  }'
Отримана відповідь приймача:

HTTP/2 202
{"message_id": "b55e9697-b462-48f0-ae83-abd40db3d183", "status": "accepted"}
Processor Lambda 3 рази намагається обробити запис (з інтервалом visibility_timeout = 120s), фіксує помилку в CloudWatch Logs і повертає batchItemFailures. Решта валідних повідомлень у черзі продовжує успішно записуватися в БД.

Перевірка наявності повідомлення в DLQ після 3 невдалих спроб через AWS CLI:

aws sqs receive-message --queue-url "[https://sqs.eu-central-1.amazonaws.com/533354335470/web1lab-iot-dlq](https://sqs.eu-central-1.amazonaws.com/533354335470/web1lab-iot-dlq)"
Результат отримання з DLQ:

JSON
{
    "Messages": [
        {
            "MessageId": "b55e9697-b462-48f0-ae83-abd40db3d183",
            "MD5OfBody": "ee93c2f788acf3acb2c5c66a9a29d4be",
            "Body": "{\"sensor_id\": \"poison-pill\", \"sensor_type\": \"temperature\", \"value\": 25, \"unit\": \"C\", \"location\": {\"lat\": 49.84, \"lon\": 24.03}, \"measured_at\": \"2026-11-25T11:15:00Z\"}"
        }
    ]
}
Хто і як має розбирати DLQ?
Розбором займаються DevOps / Backend-інженери (on-call команда):

Після підключення підписки до SNS-теми web1lab-iot-dlq-alerts інженер отримує сповіщення про спрацювання CloudWatch Alarm.

Інженер читає тіло повідомлення в DLQ та зіставляє його з логами CloudWatch Logs для Processor Lambda, щоб визначити першопричину (баг у коді обробника чи некоректні дані від конкретного датчика).

Якщо причина в багу коду — розгортається виправлення функції, після чого запускається вбудований механізм AWS SQS DLQ Redrive, який повертає повідомлення назад в основну чергу для повторної обробки. Якщо дані сміттєві — вони архівуються або видаляються.
