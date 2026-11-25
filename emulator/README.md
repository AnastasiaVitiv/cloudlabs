# Емулятор IoT-датчиків

Емулює 4 типи датчиків (`temperature`, `humidity`, `illuminance`, `camera`) у багатопотоковому режимі.

## Збірка та запуск у Docker
```bash
docker build -t iot-emulator .
docker run --rm \
  -e API_URL="https://abh7mxqkqc.execute-api.eu-central-1.amazonaws.com" \
  -e API_KEY="<YOUR_API_KEY>" \
  -e INTERVAL_TEMP_MS=50 \
  -e INTERVAL_HUM_MS=70 \
  -e INTERVAL_LIGHT_MS=90 \
  -e RUN_DURATION_SEC=180 \
  iot-emulator
