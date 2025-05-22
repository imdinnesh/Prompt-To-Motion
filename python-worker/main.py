import os
import time
import redis
import subprocess
from datetime import datetime
from dotenv import load_dotenv
from imagekitio import ImageKit
from imagekitio.models.UploadFileRequestOptions import UploadFileRequestOptions

load_dotenv()  # Loads variables from .env into the environment
private_key = os.getenv('PRIVATE_KEY')
public_key = os.getenv('PUBLIC_KEY')
url_endpoint = os.getenv('URL_ENDPOINT')

r = redis.Redis(host='localhost', port=6379, decode_responses=True)

imagekit = ImageKit(
    private_key=private_key,
    public_key=public_key,
    url_endpoint=url_endpoint
)

print("Python render worker started.")

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

    # Parse class name from the code
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

    # Absolute path to the file inside the container
    container_file_path = os.path.join("/manim", file_path)

    # Run manim render command inside Docker container (non-interactive)

    # The commnands are -ql for low quality 480p15
    #                   -qm for medium quality 720p30
    # The corresponding file name is to be used in the docker command
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
        # Build the expected output path inside host
        # Manim's default output structure: media/videos/{scene_name}/480p15/{class_name}.mp4
        # Assuming 'media' is a top-level directory sibling to 'renders' on the host
        output_file_path = os.path.join("media", "videos", "scene", "480p15", f"{class_name}.mp4")

        if os.path.exists(output_file_path):
            print(f"Video rendered successfully: {output_file_path}")
            try:
                # Prepare options for ImageKit upload
                options = UploadFileRequestOptions(
                    folder="/manim-renders",  # Optional: Organize uploads into a specific folder
                    is_private_file=False,    # Set to True if you want the file to be private
                    use_unique_file_name=True # ImageKit will generate a unique name if True
                )
                
                # Upload the video to ImageKit
                print(f"Attempting to upload {output_file_path} to ImageKit...")
                upload_response = imagekit.upload_file(
                    file=open(output_file_path, 'rb'),  # Open the file in binary read mode
                    file_name=f"{job_id}-{class_name}.mp4", # Desired file name on ImageKit
                    options=options
                )

                if upload_response and upload_response.url:
                    print(f"Video uploaded to ImageKit: {upload_response.url}")
                    r.set(f"job:{job_id}:status", "completed")
                    r.set(f"job:{job_id}:output_local", output_file_path) # Keep local path for reference
                    r.set(f"job:{job_id}:output_imagekit_url", upload_response.url)
                    r.set(f"job:{job_id}:output_imagekit_file_id", upload_response.file_id)
                else:
                    print(f"ImageKit upload failed for job {job_id}. Response: {upload_response}")
                    r.set(f"job:{job_id}:status", "completed_with_upload_error")
                    r.set(f"job:{job_id}:output_local", output_file_path)
                    r.set(f"job:{job_id}:error", "ImageKit upload failed or returned no URL.")

            except Exception as upload_e:
                print(f"Error uploading video to ImageKit for job {job_id}: {upload_e}")
                r.set(f"job:{job_id}:status", "completed_with_upload_error")
                r.set(f"job:{job_id}:output_local", output_file_path)
                r.set(f"job:{job_id}:error", f"ImageKit upload exception: {upload_e}")
        else:
            print(f"Render reported success, but output file not found: {output_file_path}")
            r.set(f"job:{job_id}:status", "error: output file not found")
            r.set(f"job:{job_id}:error", "Manim render succeeded, but video file was not found.")
    else:
        r.set(f"job:{job_id}:status", "error")
        r.set(f"job:{job_id}:error", result.stderr)
        print(f"Render failed for job {job_id}:\n{result.stderr}")

# Poll Redis for jobs
while True:
    try:
        # Use scan_iter for efficient iteration over keys
        for key in r.scan_iter("job:*:status"):
            if r.get(key) == "ready_for_render":
                job_id = key.split(":")[1]
                print(f"Processing job {job_id}...")
                r.set(key, "rendering") # Set status to rendering immediately
                process_job(job_id)
        time.sleep(3) # Wait for 3 seconds before next scan
    except Exception as e:
        print(f"Error in worker loop: {e}")
        time.sleep(5) # Wait longer on error to avoid rapid retries
