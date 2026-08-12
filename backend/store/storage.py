import os

from django.core.exceptions import ImproperlyConfigured
from django.core.files.storage import Storage

from imagekitio import ImageKit


class ImageKitStorage(Storage):
    """Django storage backend for ImageKit media files."""

    def __init__(self):
        self.private_key = os.environ.get("IMAGEKIT_PRIVATE_KEY")
        self.url_endpoint = os.environ.get("IMAGEKIT_URL_ENDPOINT")

        if not self.private_key:
            raise ImproperlyConfigured(
                "IMAGEKIT_PRIVATE_KEY is required."
            )

        if not self.url_endpoint:
            raise ImproperlyConfigured(
                "IMAGEKIT_URL_ENDPOINT is required."
            )

        self.client = ImageKit(
            private_key=self.private_key,
        )

    def _save(self, name, content):
        content.open()
        file_data = content.read()

        response = self.client.files.upload(
            file=file_data,
            file_name=os.path.basename(name),
            folder="/nyra",
            use_unique_file_name=True,
        )

        return response.file_path.lstrip("/")

    def _open(self, name, mode="rb"):
        raise NotImplementedError(
            "ImageKit files are stored remotely and cannot be opened "
            "through Django's local filesystem."
        )

    def delete(self, name):
        # Remote deletion will be implemented separately after
        # upload functionality has been verified.
        pass

    def exists(self, name):
        return False

    def url(self, name):
        return f"{self.url_endpoint.rstrip('/')}/{name.lstrip('/')}"

    def size(self, name):
        raise NotImplementedError(
            "File size is managed by ImageKit."
        )