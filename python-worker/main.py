import os
import time
import redis
import subprocess
from datetime import datetime
from dotenv import load_dotenv
from upload_providers.factory import get_uploader

load_dotenv()

r = redis.Redis(host='localhost', port=6379, decode_responses=True)

print("Python render worker started.")

# Select upload provider from environment
UPLOAD_PROVIDER = os.getenv("UPLOAD_PROVIDER", "imagekit")
uploader = get_uploader(UPLOAD_PROVIDER)

def process_job(job_id):
    print(f"Found render job: {job_id}")
    code_key = f"job:{job_id}:code"
    code = r.get(code_key)

    if not code:
        print(f"No code found for job {job_id}")
        return

    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    job_dir = f"renders/{timestamp}-{job_id}"
    os.makedirs(job_dir, exist_ok=True)
    file_path = os.path.join(job_dir, "scene.py")
    with open(file_path, 'w') as f:
        f.write(code)

    class_name = None
    for line in code.splitlines():
        if line.strip().startswith("class ") and "(Scene)" in line:
            class_name = line.split("class ")[1].split("(")[0].strip()
            break

    if not class_name:
        print(f"Could not find Scene class in job {job_id}")
        r.set(f"job:{job_id}:status", "error: no class found")
        return

    print(f"Rendering class {class_name} from job {job_id}...")

    container_file_path = os.path.join("/manim", file_path)
    docker_command = [
        "docker", "exec", "-i", "my-manim-container",
        "manim", "-ql", container_file_path, class_name
    ]

    result = subprocess.run(
        docker_command,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )

    if result.returncode == 0:
        output_file_path = os.path.join("media", "videos", "scene", "480p15", f"{class_name}.mp4")
        if os.path.exists(output_file_path):
            print(f"Video rendered successfully: {output_file_path}")
            try:
                print(f"Uploading using provider: {UPLOAD_PROVIDER}")
                upload_info = uploader.upload(output_file_path, job_id, class_name)

                r.set(f"job:{job_id}:status", "completed")
                r.set(f"job:{job_id}:output_local", output_file_path)
                r.set(f"job:{job_id}:output_url", upload_info["url"])
                r.set(f"job:{job_id}:output_file_id", upload_info["file_id"])
                r.set(f"job:{job_id}:provider", upload_info["provider"])

                print(f"Uploaded successfully: {upload_info['url']}")

            except Exception as e:
                print(f"Upload failed: {e}")
                r.set(f"job:{job_id}:status", "completed_with_upload_error")
                r.set(f"job:{job_id}:output_local", output_file_path)
                r.set(f"job:{job_id}:error", f"{UPLOAD_PROVIDER} upload error: {e}")
        else:
            print(f"Output file not found: {output_file_path}")
            r.set(f"job:{job_id}:status", "error: output file not found")
            r.set(f"job:{job_id}:error", "Render succeeded, file missing.")
    else:
        print(f"Render failed:\n{result.stderr}")
        r.set(f"job:{job_id}:status", "error")
        r.set(f"job:{job_id}:error", result.stderr)

while True:
    try:
        for key in r.scan_iter("job:*:status"):
            if r.get(key) == "ready_for_render":
                job_id = key.split(":")[1]
                print(f"Processing job {job_id}...")
                r.set(key, "rendering")
                process_job(job_id)
        time.sleep(3)
    except Exception as e:
        print(f"Worker error: {e}")
        time.sleep(5)
