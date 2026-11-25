FROM python:3.11.10-slim-bookworm

RUN useradd --create-home --shell /bin/bash appuser
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY --chown=appuser:appuser emulator.py .
USER appuser

ENV INTERVAL_TEMP_MS="50"
ENV INTERVAL_HUM_MS="75"
ENV INTERVAL_LIGHT_MS="100"
ENV CAMERA_INTERVAL_SEC="15"
ENV RUN_DURATION_SEC="300"

CMD ["python", "-u", "emulator.py"]
