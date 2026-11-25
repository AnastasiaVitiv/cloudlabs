import os
import io
import time
import random
import threading
from datetime import datetime, timezone
import requests
from PIL import Image, ImageDraw

API_URL = os.getenv("API_URL", "http://localhost:8000").rstrip("/")
API_KEY = os.getenv("API_KEY", "super-secret-iot-key-2026")

INTERVAL_TEMP_MS = max(20, int(os.getenv("INTERVAL_TEMP_MS", "50")))
INTERVAL_HUM_MS = max(20, int(os.getenv("INTERVAL_HUM_MS", "70")))
INTERVAL_LIGHT_MS = max(20, int(os.getenv("INTERVAL_LIGHT_MS", "90")))
CAMERA_INTERVAL_SEC = max(10, int(os.getenv("CAMERA_INTERVAL_SEC", "15")))
RUN_DURATION_SEC = int(os.getenv("RUN_DURATION_SEC", "300"))

STATS = {"sent": 0, "errors": 0}
LOCK = threading.Lock()
STOP_EVENT = threading.Event()

LOCATIONS = {
    "sensor-temp-01": {"lat": 49.8397, "lon": 24.0297},
    "sensor-hum-01": {"lat": 49.8410, "lon": 24.0315},
    "sensor-light-01": {"lat": 49.8380, "lon": 24.0250},
    "sensor-cam-01": {"lat": 49.8425, "lon": 24.0280},
}

def record_result(success: bool):
    with LOCK:
        if success:
            STATS["sent"] += 1
        else:
            STATS["errors"] += 1

def send_measurement(payload: dict):
    headers = {"x-api-key": API_KEY, "Content-Type": "application/json"}
    try:
        resp = requests.post(f"{API_URL}/measurements", json=payload, headers=headers, timeout=5)
        if resp.status_code == 202:
            record_result(True)
        else:
            print(f"[WARN] HTTP {resp.status_code}: {resp.text}")
            record_result(False)
    except Exception as e:
        print(f"[ERR] Request failed: {e}")
        record_result(False)

def sensor_worker(sensor_id: str, sensor_type: str, unit: str, interval_ms: int):
    interval_sec = interval_ms / 1000.0
    while not STOP_EVENT.is_set():
        start = time.monotonic()
        if sensor_type == "temperature":
            val = round(random.uniform(46.0, 55.0), 2) if random.random() < 0.02 else round(random.uniform(18.0, 28.0), 2)
        elif sensor_type == "humidity":
            val = round(random.uniform(35.0, 88.0), 2)
        else:
            val = round(random.uniform(50.0, 950.0), 2)

        payload = {
            "sensor_id": sensor_id,
            "sensor_type": sensor_type,
            "value": val,
            "unit": unit,
            "location": LOCATIONS[sensor_id],
            "measured_at": datetime.now(timezone.utc).isoformat()
        }
        send_measurement(payload)
        elapsed = time.monotonic() - start
        time.sleep(max(0.0, interval_sec - elapsed))

def generate_dummy_image(sensor_id: str) -> bytes:
    img = Image.new("RGB", (640, 480), color=(random.randint(20, 100), random.randint(50, 150), random.randint(100, 200)))
    draw = ImageDraw.Draw(img)
    draw.text((20, 20), f"{sensor_id} | {datetime.now(timezone.utc).isoformat()}", fill=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=80)
    return buf.getvalue()

def camera_worker():
    sensor_id = "sensor-cam-01"
    headers = {"x-api-key": API_KEY, "Content-Type": "application/json"}
    while not STOP_EVENT.is_set():
        try:
            r = requests.post(f"{API_URL}/sensors/upload-url", json={"sensor_id": sensor_id}, headers=headers, timeout=5)
            if r.status_code != 200:
                print(f"[CAM ERR] Failed to get upload URL: {r.status_code} {r.text}")
                record_result(False)
            else:
                data = r.json()
                upload_url = data["upload_url"]
                object_key = data["object_key"]
                img_bytes = generate_dummy_image(sensor_id)

                put_resp = requests.put(upload_url, data=img_bytes, headers={"Content-Type": "image/jpeg"}, timeout=10)
                if put_resp.status_code in (200, 204):
                    payload = {
                        "sensor_id": sensor_id,
                        "sensor_type": "camera",
                        "value": len(img_bytes),
                        "unit": "bytes",
                        "s3_key": object_key,
                        "location": LOCATIONS[sensor_id],
                        "measured_at": datetime.now(timezone.utc).isoformat()
                    }
                    send_measurement(payload)
                    print(f"[CAM OK] Uploaded {object_key} ({len(img_bytes)} bytes)")
                else:
                    print(f"[CAM ERR] S3 PUT failed: {put_resp.status_code}")
                    record_result(False)
        except Exception as e:
            print(f"[CAM ERR] {e}")
            record_result(False)

        STOP_EVENT.wait(CAMERA_INTERVAL_SEC)

if __name__ == "__main__":
    print(f"Starting IoT Emulator -> {API_URL} for {RUN_DURATION_SEC}s")
    threads = [
        threading.Thread(target=sensor_worker, args=("sensor-temp-01", "temperature", "C", INTERVAL_TEMP_MS), daemon=True),
        threading.Thread(target=sensor_worker, args=("sensor-hum-01", "humidity", "%", INTERVAL_HUM_MS), daemon=True),
        threading.Thread(target=sensor_worker, args=("sensor-light-01", "illuminance", "lux", INTERVAL_LIGHT_MS), daemon=True),
        threading.Thread(target=camera_worker, daemon=True),
    ]
    for t in threads:
        t.start()

    end_time = time.monotonic() + RUN_DURATION_SEC
    try:
        while time.monotonic() < end_time:
            time.sleep(5)
            with LOCK:
                print(f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] Sent: {STATS['sent']} | Errors: {STATS['errors']}")
    except KeyboardInterrupt:
        print("Stopping manually...")
    finally:
        STOP_EVENT.set()
        for t in threads:
            t.join(timeout=2)
        print(f"Final stats -> Sent: {STATS['sent']}, Errors: {STATS['errors']}")
