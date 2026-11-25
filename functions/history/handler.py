import os
import json
from decimal import Decimal
import boto3
from boto3.dynamodb.conditions import Key
import psycopg2
from psycopg2.extras import RealDictCursor

dynamodb = boto3.resource("dynamodb")
raw_table = dynamodb.Table(os.environ["DYNAMODB_TABLE"])
s3_client = boto3.client("s3")
BUCKET_NAME = os.environ["S3_BUCKET"]
API_KEY = os.environ["API_KEY"]

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
    return conn

class CustomEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        if hasattr(obj, "isoformat"):
            return obj.isoformat()
        return super().default(obj)

def response(status_code: int, body: dict):
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body, cls=CustomEncoder)
    }

def attach_presigned_url_if_camera(item: dict):
    s3_key = None
    if item.get("sensor_type") == "camera":
        if isinstance(item.get("metadata"), dict):
            s3_key = item["metadata"].get("s3_key")
        elif item.get("s3_key"):
            s3_key = item["s3_key"]

    if s3_key:
        item["image_url"] = s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": BUCKET_NAME, "Key": s3_key},
            ExpiresIn=300
        )
    return item

def lambda_handler(event, context):
    headers = {k.lower(): v for k, v in (event.get("headers") or {}).items()}
    if headers.get("x-api-key") != API_KEY:
        return response(401, {"error": "Invalid or missing x-api-key"})

    path_params = event.get("pathParameters") or {}
    sensor_id = path_params.get("sensor_id")
    if not sensor_id:
        return response(400, {"error": "sensor_id path parameter is required"})

    qs = event.get("queryStringParameters") or {}
    time_from = qs.get("from", "1970-01-01T00:00:00Z")
    time_to = qs.get("to", "2099-12-31T23:59:59Z")
    limit = min(500, max(1, int(qs.get("limit", "20"))))
    source = qs.get("source", "sql").lower()

    if source == "nosql":
        res = raw_table.query(
            KeyConditionExpression=Key("sensor_id").eq(sensor_id) & Key("measured_at").between(time_from, time_to),
            ScanIndexForward=False,
            Limit=limit
        )
        items = [attach_presigned_url_if_camera(i) for i in res.get("Items", [])]
        return response(200, {"source": "dynamodb", "sensor_id": sensor_id, "count": len(items), "items": items})

    db_conn = get_db_connection()
    with db_conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT sensor_id, sensor_type, raw_value, unit, processed_value,
                   is_anomaly, lat, lon, metadata, measured_at
            FROM measurements
            WHERE sensor_id = %s AND measured_at >= %s AND measured_at <= %s
            ORDER BY measured_at DESC
            LIMIT %s;
        """, (sensor_id, time_from, time_to, limit))
        rows = [attach_presigned_url_if_camera(dict(r)) for r in cur.fetchall()]

    return response(200, {"source": "postgresql", "sensor_id": sensor_id, "count": len(rows), "items": rows})