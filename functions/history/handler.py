import os
import json
from datetime import datetime, timezone
from decimal import Decimal
import boto3
from boto3.dynamodb.conditions import Key
import psycopg2
from psycopg2.extras import RealDictCursor

dynamodb = boto3.resource("dynamodb")
raw_table = dynamodb.Table(os.environ["DYNAMODB_TABLE"])
s3 = boto3.client("s3")
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
    if conn is not None and conn.closed == 0:
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT 1;")
            return conn
        except Exception:
            try:
                conn.close()
            except Exception:
                pass
            conn = None

    conn = psycopg2.connect(**DB_CONFIG)
    conn.autocommit = True
    return conn

class CustomEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

def response(status_code: int, body: dict):
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body, cls=CustomEncoder)
    }

def parse_utc_timestamp(value: str, param_name: str):
    if not isinstance(value, str) or not (value.endswith("Z") or value.endswith("+00:00")):
        return None, None, f"Query parameter '{param_name}' must be in ISO 8601 UTC format (ending with 'Z' or '+00:00')"
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if dt.tzinfo is None or dt.utcoffset() != timezone.utc.utcoffset(dt):
            return None, None, f"Query parameter '{param_name}' must be in UTC timezone"
        canonical = dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")
        return dt, canonical, None
    except Exception:
        return None, None, f"Query parameter '{param_name}' must be a valid ISO 8601 timestamp"

def attach_presigned_url_if_camera(item: dict):
    if item.get("sensor_type") == "camera":
        meta = item.get("metadata") or {}
        s3_key = meta.get("s3_key") or item.get("s3_key")
        if s3_key:
            item["image_url"] = s3.generate_presigned_url(
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
        return response(400, {"error": "Missing sensor_id in path"})

    qs = event.get("queryStringParameters") or {}
    from_ts = qs.get("from")
    to_ts = qs.get("to")
    source = qs.get("source", "sql").lower()

    if source not in ("sql", "nosql"):
        return response(400, {"error": "Query parameter 'source' must be 'sql' or 'nosql'"})

    try:
        limit_raw = int(qs.get("limit", "20"))
        if limit_raw < 1 or limit_raw > 500:
            return response(400, {"error": "Query parameter 'limit' must be between 1 and 500"})
        limit = limit_raw
    except ValueError:
        return response(400, {"error": "Query parameter 'limit' must be an integer"})

    from_dt = None
    to_dt = None
    if from_ts:
        from_dt, from_ts, err = parse_utc_timestamp(from_ts, "from")
        if err:
            return response(400, {"error": err})
    if to_ts:
        to_dt, to_ts, err = parse_utc_timestamp(to_ts, "to")
        if err:
            return response(400, {"error": err})
    if from_dt and to_dt and from_dt > to_dt:
        return response(400, {"error": "Query parameter 'from' must not be later than 'to'"})

    if source == "nosql":
        key_cond = Key("sensor_id").eq(sensor_id)
        if from_ts and to_ts:
            key_cond = key_cond & Key("measured_at").between(from_ts, to_ts)
        elif from_ts:
            key_cond = key_cond & Key("measured_at").gte(from_ts)
        elif to_ts:
            key_cond = key_cond & Key("measured_at").lte(to_ts)

        res = raw_table.query(
            KeyConditionExpression=key_cond,
            ScanIndexForward=False,
            Limit=limit
        )
        items = [attach_presigned_url_if_camera(i) for i in res.get("Items", [])]
        return response(200, {"source": "dynamodb", "sensor_id": sensor_id, "count": len(items), "items": items})

    db_conn = get_db_connection()
    query = """
        SELECT event_id, sensor_id, sensor_type, raw_value, unit, processed_value,
               is_anomaly, lat, lon, metadata, measured_at
        FROM measurements
        WHERE sensor_id = %s
    """
    params = [sensor_id]

    if from_ts:
        query += " AND measured_at >= %s"
        params.append(from_ts)
    if to_ts:
        query += " AND measured_at <= %s"
        params.append(to_ts)

    query += " ORDER BY measured_at DESC LIMIT %s"
    params.append(limit)

    with db_conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(query, tuple(params))
        rows = [attach_presigned_url_if_camera(dict(r)) for r in cur.fetchall()]

    return response(200, {"source": "postgresql", "sensor_id": sensor_id, "count": len(rows), "items": rows})
