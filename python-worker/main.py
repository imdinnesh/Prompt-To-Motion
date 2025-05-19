import os
import time
import redis
import subprocess
from datetime import datetime

r = redis.Redis(host='localhost', port=6379, decode_responses=True)

print("🎬 Python render worker started.")

def process_job(job_id):
    print(f"🛠 Found render job: {job_id}")
    code_key = f"job:{job_id}:code"
    code = r.get(code_key)

    if not code:
        print(f"⚠️ No code found for job {job_id}")
        return

    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    job_dir = f"renders/{timestamp}-{job_id}"
    os.makedirs(job_dir, exist_ok=True)
    file_path = os.path.join(job_dir, "scene.py")
    with open(file_path, 'w') as f:
        f.write(code)

    # Parse class name from the code
    class_name = None
    for line in code.splitlines():
        if line.strip().startswith("class ") and "(Scene)" in line:
            class_name = line.split("class ")[1].split("(")[0].strip()
            break

    if not class_name:
        print(f"❌ Could not find Scene class in job {job_id}")
        r.set(f"job:{job_id}:status", "error: no class found")
        return

    print(f"🎥 Rendering class {class_name} from job {job_id}...")

    # Absolute path to the file inside the container
    container_file_path = os.path.join("/manim", file_path)

    # Run manim render command inside Docker container (non-interactive)
    docker_command = [
        "docker", "exec", "-i", "my-manim-container",
        "manim", "-qm", container_file_path, class_name
    ]

    result = subprocess.run(
        docker_command,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )

    if result.returncode == 0:
        # Build the expected output path inside host
        output_file = os.path.join(job_dir, "media", "videos", "scene", "480p15", f"{class_name}.mp4")
        r.set(f"job:{job_id}:status", "completed")
        r.set(f"job:{job_id}:output", output_file)
        print(f"✅ Render complete for job {job_id}")
    else:
        r.set(f"job:{job_id}:status", "error")
        r.set(f"job:{job_id}:error", result.stderr)
        print(f"❌ Render failed for job {job_id}:\n{result.stderr}")

# Poll Redis for jobs
while True:
    try:
        for key in r.scan_iter("job:*:status"):
            if r.get(key) == "ready_for_render":
                job_id = key.split(":")[1]
                r.set(key, "rendering")
                process_job(job_id)
        time.sleep(3)
    except Exception as e:
        print(f"🔥 Error in worker loop: {e}")
        time.sleep(5)
