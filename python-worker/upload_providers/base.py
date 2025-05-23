from abc import ABC, abstractmethod

class BaseUploader(ABC):
    @abstractmethod
    def upload(self, file_path: str, job_id: str, class_name: str) -> dict:
        """
        Uploads the given file and returns a dict with:
        {
            "url": <uploaded file URL>,
            "file_id": <unique file ID or public_id>,
            "provider": <provider_name>
        }
        """
        pass
