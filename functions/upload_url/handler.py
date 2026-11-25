import os
import json
import uuid
import boto3

s3 = boto3.client("s3")
BUCKET_NAME = os.environ["S3_BUCKET"]
API_KEY = os.environ["API_KEY"]
MAX_FILE_SIZE_BYTES = 1048576

def response(status_code: int, body: dict):
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body)
    }

def lambda_handler(event, context):
    headers = {k.lower(): v for k, v in (event.get("headers") or {}).items()}
    if headers.get("x-api-key") != API_KEY:
        return response(401, {"error": "Invalid or missing x-api-key"})

    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return response(400, {"error": "Invalid JSON body"})

    if not isinstance(body, dict):
        return response(400, {"error": "JSON body must be an object"})

    sensor_id = body.get("sensor_id")
    if not isinstance(sensor_id, str) or not (1 <= len(sensor_id.strip()) <= 64):
        return response(400, {"error": "sensor_id must be a non-empty string up to 64 characters"})

    content_length = body.get("content_length", 0)
    if (
        isinstance(content_length, bool)
        or not isinstance(content_length, int)
        or content_length <= 0
        or content_length > MAX_FILE_SIZE_BYTES
    ):
        return response(400, {"error": f"content_length must be an integer between 1 and {MAX_FILE_SIZE_BYTES} bytes (1 MB)"})

    object_key = f"snapshots/{sensor_id.strip()}/{uuid.uuid4()}.jpg"

    presigned_url = s3.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": BUCKET_NAME,
            "Key": object_key,
            "ContentType": "image/jpeg",
            "ContentLength": content_length
        },
        ExpiresIn=60
    )

    return response(200, {
        "upload_url": presigned_url,
        "object_key": object_key,
        "max_size_bytes": MAX_FILE_SIZE_BYTES,
        "expires_in": 60
    })
