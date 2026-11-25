=== Test > 1 MB (2000000 bytes) ===
HTTP/2 400 
date: Wed, 25 Nov 2026 21:41:12 GMT
content-type: application/json
content-length: 81
apigw-requestid: HapexiodFiAEJEw=

{"error": "content_length must be an integer between 1 and 1048576 bytes (1 MB)"}

=== Test <= 1 MB (500000 bytes) ===
HTTP/2 200 
date: Wed, 25 Nov 2026 21:41:12 GMT
content-type: application/json
content-length: 1771
apigw-requestid: Hape4jKwFiAEJdA=

{"upload_url": "https://web1lab-iot-snapshots-107ec6d6.s3.amazonaws.com/snapshots/sensor-cam-01/a76645d4-03b6-47f5-8ec6-b204f6091a87.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=ASIAXYLTFJTXFE5WQXQE%2F20261125%2Feu-central-1%2Fs3%2Faws4_request&X-Amz-Date=20261125T214112Z&X-Amz-Expires=60&X-Amz-SignedHeaders=content-length%3Bcontent-type%3Bhost&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEOb%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaDGV1LWNlbnRyYWwtMSJIMEYCIQCfYx8qCuik%2FnFlhmiCZ3nb0Ya%2B418Om5%2FeCFgYZjH4CgIhALHM8IuRinMe7tccxNRrcTim7Bf%2F4hKAN6odZSO%2BatwaKooECK%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEQABoMNTMzMzU0MzM1NDcwIgyfE7mlIoEBJo8Qz54q3gPJ%2BhLCOPGl87awjARKFkYKJJolpf%2B5RZeu2CLjuTDBsFZrTBHt3KE22fhssi3%2FDgmSyOtWvR48RqCSGDjGoxopJT0ahTa9QFtMp2k5Ux16CnXGMKiUqQsXoBM%2BfUCWUlSUZFn4FzQHbKQQG5dzK%2BPeP7sxERrGGapbDA6vZfbA4b2cYY5FsYZyzHwoMRUw%2FFAOnJd3iQyFctVe43NVP6eCAu%2FFsDReOlowoc6pE02irvY%2F1GDl1JvXRX7BVI1yYkjHvTnudYkBAyMJc4etFpLVYwak78b3L3jY7SlwgSKZkH5HBB7WbriJvjsN2zUNfnFCvdrw2Tjhyx4H%2FNYo1zkgL6f6NQJgStVDrWEc%2BM2YEL8r2vP0vn76d4hwJ15QBr6GaSAvTFO3A2H0ob77PGs0lqRb3wcRnN24Ad92odCnQE3p2rQvQXb6SRCsqSkCtGAck6%2FRXpINGtqq8QQgmY8H7QWDU4jtCQNIG9LP8%2B34qfsCtnGVWyCd%2BSdT5SALLVTO7l649ObZVHPBtG4zXa%2FL0kBnvUNUVdLg%2Fp62ultyOU8QDY3myyH9LGkcmqyDTRhAvyG%2FjTAwR9%2FgMqocs3uWcovQbF9IvauMQmL6tEJuUoaunNn%2Fn5UGjmQdZkaRMPerndgGOqAB3sK8w255Pd3KIQaDQSSOpo7Pw%2FxwdW%2FpGgsDJHfpk0XzsgOcUKIQJLAJyYJc9JlmZaIw%2F4GMUs0C%2BMhR18u%2B5ZBgcbPJirOaCLhYOEg%2FfRjDJyTyTo%2BV0KNE8zAPZb7HfECfA6yyMfMWevOjTGmAkCAIXwGXRrZ90JIM9Y18xfjEACrJQa%2FPuyqIKcDVriBUAgXZWUjR8eHu7nDaqdIXHw%3D%3D&X-Amz-Signature=37a5ce1b4da70cfdb6c3f5e2639b7774d4c9d717b501aa82702ca594f4a1ca56", "object_key": "snapshots/sensor-cam-01/a76645d4-03b6-47f5-8ec6-b204f6091a87.jpg", "max_size_bytes": 1048576, "expires_in": 60}

=== Test Idempotency (count must be 1) ===
{
    "source": "postgresql",
    "sensor_id": "sensor-dedup-test",
    "count": 1,
    "items": [
        {
            "event_id": "11111111-2222-3333-4444-555555555555",
            "sensor_id": "sensor-dedup-test",
            "sensor_type": "temperature",
            "raw_value": 22.0,
            "unit": "C",
            "processed_value": 71.6,
            "is_anomaly": false,
            "lat": 49.84,
            "lon": 24.03,
            "metadata": {
                "fahrenheit": 71.6
            },
            "measured_at": "2026-11-25T21:00:00+00:00"
        }
    ]
}
