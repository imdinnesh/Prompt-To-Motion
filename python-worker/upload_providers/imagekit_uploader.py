from imagekitio import ImageKit
from imagekitio.models.UploadFileRequestOptions import UploadFileRequestOptions
import os
from .base import BaseUploader

class ImageKitUploader(BaseUploader):
    def __init__(self):
        self.client = ImageKit(
            private_key=os.getenv("PRIVATE_KEY"),
            public_key=os.getenv("PUBLIC_KEY"),
            url_endpoint=os.getenv("URL_ENDPOINT")
        )

    def upload(self, file_path: str, job_id: str, class_name: str) -> dict:
        options = UploadFileRequestOptions(
            folder="/manim-renders",
            is_private_file=False,
            use_unique_file_name=True
        )
        with open(file_path, 'rb') as file:
            response = self.client.upload_file(
                file=file,
                file_name=f"{job_id}-{class_name}.mp4",
                options=options
            )
        return {
            "url": response.url,
            "file_id": response.file_id,
            "provider": "imagekit"
        }
