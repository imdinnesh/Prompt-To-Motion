# upload_providers/factory.py
from .imagekit_uploader import ImageKitUploader
from .cloudinary_uploader import CloudinaryUploader

def get_uploader(provider_name: str):
    if provider_name == "imagekit":
        return ImageKitUploader()
    elif provider_name == "cloudinary":
        return CloudinaryUploader()
    else:
        raise ValueError(f"Unknown upload provider: {provider_name}")
