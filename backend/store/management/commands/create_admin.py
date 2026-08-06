import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = (
        "Create (or update) the initial admin/staff user for the dashboard. "
        "Reads defaults from ADMIN_USERNAME / ADMIN_EMAIL / ADMIN_PASSWORD "
        "env vars if flags are not passed."
    )

    def add_arguments(self, parser):
        parser.add_argument("--username", default=None)
        parser.add_argument("--email", default=None)
        parser.add_argument("--password", default=None)

    def handle(self, *args, **options):
        User = get_user_model()

        username = options["username"] or os.environ.get("ADMIN_USERNAME", "admin")
        email = options["email"] or os.environ.get("ADMIN_EMAIL", "admin@nyra.dz")
        password = options["password"] or os.environ.get("ADMIN_PASSWORD")

        if not password:
            self.stderr.write(
                self.style.ERROR(
                    "No password provided. Pass --password or set ADMIN_PASSWORD in .env."
                )
            )
            return

        user, created = User.objects.get_or_create(
            username=username, defaults={"email": email}
        )
        user.email = email
        user.is_staff = True
        user.is_superuser = True
        user.set_password(password)
        user.save()

        action = "created" if created else "updated"
        self.stdout.write(
            self.style.SUCCESS(f"Admin user '{username}' {action} successfully.")
        )
