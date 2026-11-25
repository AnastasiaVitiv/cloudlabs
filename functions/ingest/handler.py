import os
import json
import math
import uuid
from datetime import datetime, timezone
import boto3

sqs = boto3.client("sqs")
QUEUE_URL = os.environ["QUEUE_URL"]
API_KEY = os.environ["API_KEY"]
ALLOWED_TYPES = {"temperature", "humidity", "illuminance", "camera"}

def response(status_code: int, body: dict):
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body)
    }

def reject_non_standard_json_constants(val):
    raise ValueError(f"Non-standard JSON constant not allowed: {val}")

def is_valid_finite_number(val) -> bool:
    return isinstance(val, (int, float)) and not isinstance(val, bool) and math.isfinite(val)

def validate_payload(data):
    if not isinstance(data, dict):
        return "JSON body must be an object"

    required = ["sensor_id", "sensor_type", "value", "unit", "location", "measured_at"]
    for field in required:
        if field not in data:
            return f"Missing required field: {field}"

    if not isinstance(data["sensor_id"], str) or not (1 <= len(data["sensor_id"].strip()) <= 64):
        return "sensor_id must be a non-empty string up to 64 characters"

    if not isinstance(data["sensor_type"], str) or len(data["sensor_type"]) > 32 or data["sensor_type"] not in ALLOWED_TYPES:
        return f"sensor_type must be a string (max 32 chars) and one of {sorted(ALLOWED_TYPES)}"

    if "event_id" in data and data["event_id"] is not None:
        if not isinstance(data["event_id"], str) or not (1 <= len(data["event_id"].strip()) <= 64):
            return "event_id must be a non-empty string up to 64 characters"

    if not is_valid_finite_number(data["value"]):
        return "value must be a finite number"

    if not isinstance(data["unit"], str) or not (1 <= len(data["unit"].strip()) <= 16):
        return "unit must be a non-empty string up to 16 characters"

    loc = data["location"]
    if not isinstance(loc, dict) or "lat" not in loc or "lon" not in loc:
        return "location must be an object with 'lat' and 'lon'"
    if not is_valid_finite_number(loc["lat"]) or not is_valid_finite_number(loc["lon"]):
        return "location.lat and location.lon must be finite numbers (not booleans)"
    if not (-90.0 <= loc["lat"] <= 90.0):
        return "location.lat must be between -90 and 90"
    if not (-180.0 <= loc["lon"] <= 180.0):
        return "location.lon must be between -180 and 180"

    ts_raw = data["measured_at"]
    if not isinstance(ts_raw, str) or not (ts_raw.endswith("Z") or ts_raw.endswith("+00:00")):
        return "measured_at must be in ISO 8601 UTC format (ending with 'Z' or '+00:00')"
    try:
        dt = datetime.fromisoformat(ts_raw.replace("Z", "+00:00"))
        if dt.tzinfo is None or dt.utcoffset() != timezone.utc.utcoffset(dt):
            return "measured_at must be in UTC timezone"
    except Exception:
        return "measured_at must be a valid ISO 8601 timestamp"

    return None

def lambda_handler(event, context):
    headers = {k.lower(): v for k, v in (event.get("headers") or {}).items()}
    if headers.get("x-api-key") != API_KEY:
        return response(401, {"error": "Invalid or missing x-api-key"})

    try:
        body = json.loads(
            event.get("body") or "{}",
            parse_constant=reject_non_standard_json_constants
        )
    except (json.JSONDecodeError, ValueError) as e:
        return response(400, {"error": f"Invalid JSON body: {e}"})

    err = validate_payload(body)
    if err:
        return response(400, {"error": err})

    if not body.get("event_id"):
        body["event_id"] = str(uuid.uuid4())

    sqs_resp = sqs.send_message(
        QueueUrl=QUEUE_URL,
        MessageBody=json.dumps(body, allow_nan=False)
    )

    return response(202, {
        "message_id": sqs_resp["MessageId"],
        "event_id": body["event_id"],
        "status": "accepted"
    })
