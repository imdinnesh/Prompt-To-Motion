# upload_providers/cloudinary_uploader.py
import cloudinary
import cloudinary.uploader
import os
from .base import BaseUploader

class CloudinaryUploader(BaseUploader):
    def __init__(self):
        cloudinary.config(
            cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
            api_key=os.getenv("CLOUDINARY_API_KEY"),
            api_secret=os.getenv("CLOUDINARY_API_SECRET")
        )

    def upload(self, file_path: str, job_id: str, class_name: str) -> dict:
        response = cloudinary.uploader.upload_large(
            file_path,
            resource_type="video",
            folder="manim-renders/",
            public_id=f"{job_id}-{class_name}",
            overwrite=True
        )
        return {
            "url": response.get("secure_url"),
            "file_id": response.get("public_id"),
            "provider": "cloudinary"
        }
