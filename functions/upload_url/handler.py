import os
import json
import uuid
import boto3

s3 = boto3.client("s3")
BUCKET_NAME = os.environ["S3_BUCKET"]
API_KEY = os.environ["API_KEY"]

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
        body = {}

    sensor_id = body.get("sensor_id", "unknown-cam")
    object_key = f"snapshots/{sensor_id}/{uuid.uuid4()}.jpg"

    presigned_url = s3.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": BUCKET_NAME,
            "Key": object_key,
            "ContentType": "image/jpeg"
        },
        ExpiresIn=60
    )

    return response(200, {
        "upload_url": presigned_url,
        "object_key": object_key,
        "expires_in": 60
    })
