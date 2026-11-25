FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY emulator.py .

ENV API_URL="http://localhost:8000"
ENV INTERVAL_TEMP_MS="50"
ENV INTERVAL_HUM_MS="75"
ENV INTERVAL_LIGHT_MS="100"
ENV CAMERA_INTERVAL_SEC="15"
ENV RUN_DURATION_SEC="300"

CMD ["python", "-u", "emulator.py"]
