import os
import json
from decimal import Decimal
import boto3
import psycopg2
from psycopg2.extras import Json

dynamodb = boto3.resource("dynamodb")
raw_table = dynamodb.Table(os.environ["DYNAMODB_TABLE"])

DB_CONFIG = {
    "host": os.environ["DB_HOST"],
    "port": int(os.environ.get("DB_PORT", "5432")),
    "dbname": os.environ["DB_NAME"],
    "user": os.environ["DB_USER"],
    "password": os.environ["DB_PASSWORD"],
    "connect_timeout": 5
}

conn = None

def get_db_connection():
    global conn
    if conn is None or conn.closed != 0:
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = True
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS measurements (
                    id BIGSERIAL PRIMARY KEY,
                    event_id VARCHAR(64) NOT NULL,
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
                    CONSTRAINT uq_event_id UNIQUE (event_id)
                );
                CREATE INDEX IF NOT EXISTS idx_measurements_sensor_time
                    ON measurements (sensor_id, measured_at DESC);
            """)
    return conn

def process_measurement(data: dict):
    if data.get("sensor_id") == "poison-pill" or data.get("force_error"):
        raise ValueError("Simulated processing failure for DLQ demonstration")

    s_type = data["sensor_type"]
    val = float(data["value"])
    is_anomaly = False
    processed_val = val
    meta = {}

    if s_type == "temperature":
        if val < -60 or val > 100:
            raise ValueError(f"Temperature out of physical sensor bounds: {val}")
        processed_val = round(val * 1.8 + 32.0, 2)
        is_anomaly = val > 40.0 or val < -10.0
        meta = {"fahrenheit": processed_val}

    elif s_type == "humidity":
        if val < 0 or val > 100:
            raise ValueError(f"Humidity out of bounds [0..100]: {val}")
        processed_val = round(val - 50.0, 2)
        is_anomaly = val > 85.0 or val < 15.0
        meta = {"deviation_from_norm": processed_val}

    elif s_type == "illuminance":
        if val < 0:
            raise ValueError(f"Negative illuminance: {val}")
        level = "dark" if val < 50 else ("indoor" if val < 500 else "bright_daylight")
        is_anomaly = val > 900.0
        meta = {"light_level": level}

    elif s_type == "camera":
        s3_key = data.get("s3_key")
        if not s3_key:
            raise ValueError("Camera message missing s3_key")
        if val > 1048576:
            raise ValueError(f"Camera image exceeds 1 MB limit: {val} bytes")
        meta = {"s3_key": s3_key}

    else:
        raise ValueError(f"Unknown sensor_type: {s_type}")

    return processed_val, is_anomaly, meta

