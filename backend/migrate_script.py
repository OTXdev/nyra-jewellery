import os
import sys
from pathlib import Path
import django

# Set up Python path and Django settings
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "nyra.settings")
django.setup()

# Imports MUST come after django.setup()
from django.core.files import File
from django.core.files.storage import FileSystemStorage
from store.models import Category, Collection, ProductImage

# Configure source media storage
local_storage = FileSystemStorage(location=BASE_DIR / "media")


def migrate_image(obj, field_name="image"):
    field = getattr(obj, field_name)
    if not field or not field.name:
        return "SKIP", None

    old_name = field.name

    # Skip files already migrated to ImageKit/cloud path
    if old_name.startswith("nyra/"):
        return "SKIP", old_name

    # Skip files that don't exist on local disk
    if not local_storage.exists(old_name):
        return "MISSING", old_name

    local_path = local_storage.path(old_name)

    # Save to the new storage engine configured on the model field
    with open(local_path, "rb") as f:
        new_name = field.storage.save(
            old_name,
            File(f),
        )

    # Update database record
    setattr(obj, field_name, new_name)
    obj.save(update_fields=[field_name])

    return "MIGRATED", new_name


if __name__ == "__main__":
    print("Starting image migration process...\n")

    models = [Category, Collection, ProductImage]

    for model in models:
        print(f"=== Processing {model.__name__} ===")
        processed_count = 0

        for obj in model.objects.exclude(image=""):
            result, name = migrate_image(obj)
            print(f"[{model.__name__} ID {obj.id}] {result} -> {name}")
            processed_count += 1

        print(f"Finished {model.__name__}. Processed: {processed_count}\n")

    print("Migration finished successfully!")